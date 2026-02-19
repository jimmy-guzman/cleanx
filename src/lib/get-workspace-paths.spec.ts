import { glob, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { getWorkspacePaths } from "./get-workspace-paths";

vi.mock("node:fs/promises", async (importOriginal) => {
  const original =
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- needed for importOriginal generic
    await importOriginal<typeof import("node:fs/promises")>();

  return {
    ...original,
    glob: vi.fn(),
    readdir: vi.fn(),
    readFile: vi.fn(),
  };
});

const mockedReaddir = vi.mocked(readdir);
const mockedReadFile = vi.mocked(readFile);
const mockedGlob = vi.mocked(glob);

type GlobReturn = ReturnType<typeof glob>;
type ReaddirReturn = ReturnType<typeof readdir>;
type ReadFileReturn = ReturnType<typeof readFile>;

function createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]() {
      let index = 0;

      return {
        next() {
          if (index < items.length) {
            return Promise.resolve({
              done: false as const,
              value: items[index++] as T,
            });
          }

          return Promise.resolve({ done: true as const, value: undefined });
        },
      };
    },
  };
}

function setupReaddir(mapping: Record<string, string[]>) {
  mockedReaddir.mockImplementation(async (dir) => {
    const dirStr = dir as string;
    const entries = mapping[dirStr];

    if (entries) {
      return entries as unknown as ReaddirReturn;
    }

    throw new Error("ENOENT");
  });
}

function setupReadFile(mapping: Record<string, string>) {
  mockedReadFile.mockImplementation(async (filePath) => {
    const pathStr = filePath as string;

    for (const [suffix, content] of Object.entries(mapping)) {
      if (pathStr.endsWith(suffix)) {
        return content as unknown as ReadFileReturn;
      }
    }

    throw new Error("ENOENT");
  });
}

describe("getWorkspacePaths", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findWorkspaceRoot", () => {
    it("should return just the root when no workspace config is found", async () => {
      setupReaddir({
        "/repo": ["package.json", "src"],
      });
      setupReadFile({});

      const result = await getWorkspacePaths("/repo");

      expect(result).toStrictEqual(["/repo"]);
    });

    it("should traverse up to find package.json", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        "/repo/packages": ["a"],
        "/repo/packages/a": ["src"],
      });
      setupReadFile({});

      const result = await getWorkspacePaths("/repo/packages/a");

      expect(result).toContain("/repo");
    });

    it("should return cwd if no package.json found anywhere", async () => {
      mockedReaddir.mockImplementation(async (dir) => {
        const dirStr = dir as string;

        if (dirStr === "/") {
          return ["bin", "usr"] as unknown as ReaddirReturn;
        }

        return ["src"] as unknown as ReaddirReturn;
      });
      setupReadFile({});

      const result = await getWorkspacePaths("/no-pkg");

      expect(result).toStrictEqual(["/no-pkg"]);
    });
  });

  describe("pnpm-workspace.yaml", () => {
    it("should find workspaces from pnpm-workspace.yaml", async () => {
      setupReaddir({
        "/repo": ["package.json", "pnpm-workspace.yaml"],
        [resolve("/repo", "packages/a")]: ["package.json"],
        [resolve("/repo", "packages/b")]: ["package.json"],
      });
      setupReadFile({
        "pnpm-workspace.yaml": "packages:\n  - 'packages/*'",
      });
      mockedGlob.mockReturnValue(
        createAsyncIterable(["packages/a", "packages/b"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain("/repo");
      expect(result).toContain(resolve("/repo", "packages/a"));
      expect(result).toContain(resolve("/repo", "packages/b"));
    });

    it("should handle pnpm-workspace.yaml with unquoted patterns", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "packages/a")]: ["package.json"],
      });
      setupReadFile({
        "pnpm-workspace.yaml": "packages:\n  - packages/*",
      });
      mockedGlob.mockReturnValue(
        createAsyncIterable(["packages/a"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain(resolve("/repo", "packages/a"));
    });

    it("should handle pnpm-workspace.yaml with double-quoted patterns", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "apps/web")]: ["package.json"],
      });
      setupReadFile({
        "pnpm-workspace.yaml": 'packages:\n  - "apps/*"',
      });
      mockedGlob.mockReturnValue(
        createAsyncIterable(["apps/web"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain(resolve("/repo", "apps/web"));
    });

    it("should handle pnpm-workspace.yaml with empty packages array", async () => {
      setupReaddir({
        "/repo": ["package.json"],
      });
      setupReadFile({
        "pnpm-workspace.yaml": "packages: []",
      });

      const result = await getWorkspacePaths("/repo");

      expect(result).toStrictEqual(["/repo"]);
    });

    it("should stop parsing at non-list, non-comment line", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "packages/a")]: ["package.json"],
      });
      setupReadFile({
        "pnpm-workspace.yaml":
          "packages:\n  - packages/*\nsomethingElse:\n  - other/*",
      });
      mockedGlob.mockReturnValue(
        createAsyncIterable(["packages/a"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain(resolve("/repo", "packages/a"));
    });

    it("should skip comments within packages list", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "packages/a")]: ["package.json"],
      });
      setupReadFile({
        "pnpm-workspace.yaml": "packages:\n  # comment\n  - packages/*",
      });
      mockedGlob.mockReturnValue(
        createAsyncIterable(["packages/a"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain(resolve("/repo", "packages/a"));
    });

    it("should ignore lines before packages key", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "packages/a")]: ["package.json"],
      });
      setupReadFile({
        "pnpm-workspace.yaml":
          "# some comment\ncatalog:\n  react: ^19\npackages:\n  - packages/*",
      });
      mockedGlob.mockReturnValue(
        createAsyncIterable(["packages/a"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain(resolve("/repo", "packages/a"));
    });

    it("should skip empty quoted patterns", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "packages/a")]: ["package.json"],
      });
      setupReadFile({
        "pnpm-workspace.yaml": "packages:\n  - ''\n  - packages/*",
      });
      mockedGlob.mockReturnValue(
        createAsyncIterable(["packages/a"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain(resolve("/repo", "packages/a"));
      // The glob should only be called with "packages/*", not with ""
      expect(mockedGlob).toHaveBeenCalledWith("packages/*", expect.anything());
    });
  });

  describe("package.json workspaces", () => {
    it("should find workspaces from package.json workspaces array", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "packages/a")]: ["package.json"],
      });

      mockedReadFile.mockImplementation(async (filePath) => {
        const pathStr = filePath as string;

        if (pathStr.endsWith("pnpm-workspace.yaml")) {
          throw new Error("ENOENT");
        }

        if (pathStr.endsWith("package.json")) {
          return JSON.stringify({
            workspaces: ["packages/*"],
          }) as unknown as ReadFileReturn;
        }

        throw new Error("ENOENT");
      });

      mockedGlob.mockReturnValue(
        createAsyncIterable(["packages/a"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain("/repo");
      expect(result).toContain(resolve("/repo", "packages/a"));
    });

    it("should handle package.json workspaces object with packages field", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "apps/web")]: ["package.json"],
      });

      mockedReadFile.mockImplementation(async (filePath) => {
        const pathStr = filePath as string;

        if (pathStr.endsWith("pnpm-workspace.yaml")) {
          throw new Error("ENOENT");
        }

        if (pathStr.endsWith("package.json")) {
          return JSON.stringify({
            workspaces: { packages: ["apps/*"] },
          }) as unknown as ReadFileReturn;
        }

        throw new Error("ENOENT");
      });

      mockedGlob.mockReturnValue(
        createAsyncIterable(["apps/web"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain("/repo");
      expect(result).toContain(resolve("/repo", "apps/web"));
    });

    it("should return root-only when package.json has no workspaces field", async () => {
      setupReaddir({
        "/repo": ["package.json"],
      });

      mockedReadFile.mockImplementation(async (filePath) => {
        const pathStr = filePath as string;

        if (pathStr.endsWith("pnpm-workspace.yaml")) {
          throw new Error("ENOENT");
        }

        if (pathStr.endsWith("package.json")) {
          return JSON.stringify({
            name: "my-app",
          }) as unknown as ReadFileReturn;
        }

        throw new Error("ENOENT");
      });

      const result = await getWorkspacePaths("/repo");

      expect(result).toStrictEqual(["/repo"]);
    });
  });

  describe("deno.json workspaces", () => {
    it("should find workspaces from deno.json workspace array", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "packages/a")]: ["package.json"],
      });

      mockedReadFile.mockImplementation(async (filePath) => {
        const pathStr = filePath as string;

        if (pathStr.endsWith("pnpm-workspace.yaml")) {
          throw new Error("ENOENT");
        }

        if (pathStr.endsWith("package.json")) {
          return JSON.stringify({
            name: "my-deno-app",
          }) as unknown as ReadFileReturn;
        }

        if (pathStr.endsWith("deno.json")) {
          return JSON.stringify({
            workspace: ["packages/*"],
          }) as unknown as ReadFileReturn;
        }

        throw new Error("ENOENT");
      });

      mockedGlob.mockReturnValue(
        createAsyncIterable(["packages/a"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain("/repo");
      expect(result).toContain(resolve("/repo", "packages/a"));
    });

    it("should find workspaces from deno.jsonc workspace with members", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "modules/core")]: ["package.json"],
      });

      mockedReadFile.mockImplementation(async (filePath) => {
        const pathStr = filePath as string;

        if (pathStr.endsWith("pnpm-workspace.yaml")) {
          throw new Error("ENOENT");
        }

        if (pathStr.endsWith("package.json")) {
          return JSON.stringify({
            name: "my-deno-app",
          }) as unknown as ReadFileReturn;
        }

        if (pathStr.endsWith("deno.json")) {
          throw new Error("ENOENT");
        }

        if (pathStr.endsWith("deno.jsonc")) {
          return JSON.stringify({
            workspace: { members: ["modules/*"] },
          }) as unknown as ReadFileReturn;
        }

        throw new Error("ENOENT");
      });

      mockedGlob.mockReturnValue(
        createAsyncIterable(["modules/core"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain("/repo");
      expect(result).toContain(resolve("/repo", "modules/core"));
    });

    it("should handle deno.json with non-object, non-array workspace", async () => {
      setupReaddir({
        "/repo": ["package.json"],
      });

      mockedReadFile.mockImplementation(async (filePath) => {
        const pathStr = filePath as string;

        if (pathStr.endsWith("pnpm-workspace.yaml")) {
          throw new Error("ENOENT");
        }

        if (pathStr.endsWith("package.json")) {
          return JSON.stringify({ name: "app" }) as unknown as ReadFileReturn;
        }

        if (pathStr.endsWith("deno.json")) {
          return JSON.stringify({
            workspace: true,
          }) as unknown as ReadFileReturn;
        }

        throw new Error("ENOENT");
      });

      const result = await getWorkspacePaths("/repo");

      expect(result).toStrictEqual(["/repo"]);
    });
  });

  describe("negation patterns", () => {
    it("should handle negation patterns in workspace config", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "packages/a")]: ["package.json"],
        [resolve("/repo", "packages/b")]: ["package.json"],
      });

      mockedReadFile.mockImplementation(async (filePath) => {
        const pathStr = filePath as string;

        if (pathStr.endsWith("pnpm-workspace.yaml")) {
          throw new Error("ENOENT");
        }

        if (pathStr.endsWith("package.json")) {
          return JSON.stringify({
            workspaces: ["packages/*", "!packages/b"],
          }) as unknown as ReadFileReturn;
        }

        throw new Error("ENOENT");
      });

      let callCount = 0;

      mockedGlob.mockImplementation((_pattern, _options) => {
        callCount++;

        if (callCount === 1) {
          return createAsyncIterable([
            "packages/a",
            "packages/b",
          ]) as GlobReturn;
        }

        return createAsyncIterable(["packages/b"]) as GlobReturn;
      });

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain("/repo");
      expect(result).toContain(resolve("/repo", "packages/a"));
      expect(result).not.toContain(resolve("/repo", "packages/b"));
    });
  });

  describe("edge cases", () => {
    it("should deduplicate workspace paths", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "packages/a")]: ["package.json"],
      });

      mockedReadFile.mockImplementation(async (filePath) => {
        const pathStr = filePath as string;

        if (pathStr.endsWith("pnpm-workspace.yaml")) {
          throw new Error("ENOENT");
        }

        if (pathStr.endsWith("package.json")) {
          return JSON.stringify({
            workspaces: ["packages/*"],
          }) as unknown as ReadFileReturn;
        }

        throw new Error("ENOENT");
      });

      mockedGlob.mockReturnValue(
        createAsyncIterable(["packages/a", "packages/a"]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      const uniqueResult = [...new Set(result)];

      expect(result).toStrictEqual(uniqueResult);
    });

    it("should skip glob results that are not directories with package.json", async () => {
      setupReaddir({
        "/repo": ["package.json"],
        [resolve("/repo", "packages/a")]: ["package.json"],
        [resolve("/repo", "packages/readme")]: ["README.md"],
      });

      mockedReadFile.mockImplementation(async (filePath) => {
        const pathStr = filePath as string;

        if (pathStr.endsWith("pnpm-workspace.yaml")) {
          throw new Error("ENOENT");
        }

        if (pathStr.endsWith("package.json")) {
          return JSON.stringify({
            workspaces: ["packages/*"],
          }) as unknown as ReadFileReturn;
        }

        throw new Error("ENOENT");
      });

      mockedGlob.mockReturnValue(
        createAsyncIterable([
          "packages/a",
          "packages/readme",
          "packages/nonexistent",
        ]) as GlobReturn,
      );

      const result = await getWorkspacePaths("/repo");

      expect(result).toContain("/repo");
      expect(result).toContain(resolve("/repo", "packages/a"));
      expect(result).not.toContain(resolve("/repo", "packages/readme"));
      expect(result).not.toContain(resolve("/repo", "packages/nonexistent"));
    });

    it("should handle readJsonFile returning null for malformed JSON", async () => {
      setupReaddir({
        "/repo": ["package.json"],
      });

      mockedReadFile.mockImplementation(async (filePath) => {
        const pathStr = filePath as string;

        if (pathStr.endsWith("pnpm-workspace.yaml")) {
          throw new Error("ENOENT");
        }

        if (pathStr.endsWith("package.json")) {
          return "not valid json{" as unknown as ReadFileReturn;
        }

        throw new Error("ENOENT");
      });

      const result = await getWorkspacePaths("/repo");

      expect(result).toStrictEqual(["/repo"]);
    });
  });
});
