import { resolve } from "node:path";

import { resolveWorkspaceConfigs } from "./resolve-workspace-configs";

vi.mock("tinyglobby", () => {
  return {
    glob: vi.fn(),
  };
});

const { glob } = await import("tinyglobby");
const mockGlob = vi.mocked(glob);

describe("resolveWorkspaceConfigs", () => {
  const mockCwd = "/project";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should return root config when no workspaces are defined", async () => {
      const rootConfig = {
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {},
        cwd: mockCwd,
        profileConfig: {},
        rootConfig,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.dir).toBe(mockCwd);
      expect(result[0]?.config).toStrictEqual({
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
      });
    });

    it("should resolve workspace patterns and return workspace configs", async () => {
      const workspaceDir1 = resolve(mockCwd, "packages/app");
      const workspaceDir2 = resolve(mockCwd, "packages/lib");

      mockGlob.mockResolvedValueOnce([workspaceDir1, workspaceDir2]);

      const rootConfig = {
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
        workspaces: {
          "packages/*": {
            exclude: ["dist"],
          },
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {},
        cwd: mockCwd,
        profileConfig: {},
        rootConfig,
      });

      expect(mockGlob).toHaveBeenCalledWith("packages/*", {
        absolute: true,
        cwd: mockCwd,
        onlyDirectories: true,
      });

      expect(result).toHaveLength(3); // root + 2 workspaces

      expect(result[1]?.dir).toBe(workspaceDir1);
      expect(result[1]?.config.exclude).toStrictEqual(["node_modules", "dist"]);

      expect(result[2]?.dir).toBe(workspaceDir2);
      expect(result[2]?.config.exclude).toStrictEqual(["node_modules", "dist"]);
    });

    it("should merge CLI config overrides correctly", async () => {
      const workspaceDir = resolve(mockCwd, "packages/app");

      mockGlob.mockResolvedValueOnce([workspaceDir]);

      const rootConfig = {
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
        workspaces: {
          "packages/*": {
            exclude: ["dist"],
          },
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {
          dryRun: true,
          exclude: ["temp"],
        },
        cwd: mockCwd,
        profileConfig: {},
        rootConfig,
      });

      expect(result[0]?.config.dryRun).toBe(true);
      expect(result[1]?.config.dryRun).toBe(true);

      expect(result[1]?.config.exclude).toStrictEqual([
        "node_modules",
        "dist",
        "temp",
      ]);
    });
  });

  describe("workspace directory exclusion from root", () => {
    it("should exclude workspace directories from root config to prevent deletion", async () => {
      const workspaceDir1 = resolve(mockCwd, "packages/app");
      const workspaceDir2 = resolve(mockCwd, "packages/lib");

      mockGlob.mockResolvedValueOnce([workspaceDir1, workspaceDir2]);

      const rootConfig = {
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
        workspaces: {
          "packages/*": {},
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {},
        cwd: mockCwd,
        profileConfig: {},
        rootConfig,
      });

      const rootResult = result[0];

      expect(rootResult?.dir).toBe(mockCwd);
      expect(rootResult?.config.exclude).toContain("node_modules");
      // Workspace dirs should be excluded from root to prevent accidental deletion
      expect(rootResult?.config.exclude).toContain("packages/app");
      expect(rootResult?.config.exclude).toContain("packages/lib");
    });

    it("should handle nested workspace directories correctly", async () => {
      const workspaceDir1 = resolve(mockCwd, "apps/frontend");
      const workspaceDir2 = resolve(mockCwd, "libs/shared/utils");

      mockGlob
        .mockResolvedValueOnce([workspaceDir1])
        .mockResolvedValueOnce([workspaceDir2]);

      const rootConfig = {
        dryRun: false,
        exclude: [],
        include: ["**/*"],
        workspaces: {
          "apps/*": {},
          "libs/shared/*": {},
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {},
        cwd: mockCwd,
        profileConfig: {},
        rootConfig,
      });

      const rootResult = result[0];

      expect(rootResult?.config.exclude).toContain("apps/frontend");
      expect(rootResult?.config.exclude).toContain("libs/shared/utils");
    });

    it("should not exclude directories outside the project root", async () => {
      const workspaceDir1 = resolve(mockCwd, "../external");
      const workspaceDir2 = resolve(mockCwd, "packages/app");

      mockGlob
        .mockResolvedValueOnce([workspaceDir1])
        .mockResolvedValueOnce([workspaceDir2]);

      const rootConfig = {
        dryRun: false,
        exclude: [],
        include: ["**/*"],
        workspaces: {
          "../external": {},
          "packages/*": {},
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {},
        cwd: mockCwd,
        profileConfig: {},
        rootConfig,
      });

      const rootResult = result[0];

      // External dirs shouldn't be added to root exclusions
      expect(rootResult?.config.exclude).not.toContain("../external");
      expect(rootResult?.config.exclude).toContain("packages/app");
    });

    it("should preserve existing exclude patterns while adding workspace dirs", async () => {
      const workspaceDir = resolve(mockCwd, "packages/app");

      mockGlob.mockResolvedValueOnce([workspaceDir]);

      const rootConfig = {
        dryRun: false,
        exclude: ["node_modules", "*.log"],
        include: ["**/*"],
        workspaces: {
          "packages/*": {},
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {},
        cwd: mockCwd,
        profileConfig: {},
        rootConfig,
      });

      const rootResult = result[0];

      expect(rootResult?.config.exclude).toContain("node_modules");
      expect(rootResult?.config.exclude).toContain("*.log");
      expect(rootResult?.config.exclude).toContain("packages/app");
      expect(rootResult?.config.exclude).toHaveLength(3);
    });

    it("should handle multiple CLI exclude patterns with workspace exclusions", async () => {
      const workspaceDir = resolve(mockCwd, "packages/app");

      mockGlob.mockResolvedValueOnce([workspaceDir]);

      const rootConfig = {
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
        workspaces: {
          "packages/*": { exclude: ["dist"] },
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: { exclude: ["temp", "logs"] },
        cwd: mockCwd,
        profileConfig: { exclude: ["cache"] },
        rootConfig,
      });

      const rootResult = result[0];

      expect(rootResult?.config.exclude).toContain("node_modules");
      expect(rootResult?.config.exclude).toContain("packages/app");
      expect(rootResult?.config.exclude).toContain("temp");
      expect(rootResult?.config.exclude).toContain("logs");
      expect(rootResult?.config.exclude).toContain("cache");

      const workspaceResult = result[1];

      expect(workspaceResult?.config.exclude).toContain("cache");
      expect(workspaceResult?.config.exclude).toContain("node_modules");
      expect(workspaceResult?.config.exclude).toContain("dist");
      expect(workspaceResult?.config.exclude).toContain("temp");
      expect(workspaceResult?.config.exclude).toContain("logs");
      // Workspace shouldn't exclude itself
      expect(workspaceResult?.config.exclude).not.toContain("packages/app");
    });
  });

  describe("multiple workspace patterns", () => {
    it("should handle multiple workspace patterns correctly", async () => {
      const appsDir = resolve(mockCwd, "apps/frontend");
      const packagesDir = resolve(mockCwd, "packages/ui");

      mockGlob
        .mockResolvedValueOnce([appsDir])
        .mockResolvedValueOnce([packagesDir]);

      const rootConfig = {
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
        workspaces: {
          "apps/*": { exclude: ["build"] },
          "packages/*": { exclude: ["dist"] },
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {},
        cwd: mockCwd,
        profileConfig: {},
        rootConfig,
      });

      expect(mockGlob).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(3); // root + 2 workspaces

      const rootResult = result[0];

      expect(rootResult?.config.exclude).toContain("apps/frontend");
      expect(rootResult?.config.exclude).toContain("packages/ui");
      expect(rootResult?.config.exclude).toContain("node_modules");

      const appsResult = result.find((r) => {
        return r.dir === appsDir;
      });

      expect(appsResult?.config.exclude).toContain("node_modules");
      expect(appsResult?.config.exclude).toContain("build");
      expect(appsResult?.config.exclude).not.toContain("dist");

      const packagesResult = result.find((r) => {
        return r.dir === packagesDir;
      });

      expect(packagesResult?.config.exclude).toContain("node_modules");
      expect(packagesResult?.config.exclude).toContain("dist");
      expect(packagesResult?.config.exclude).not.toContain("build");
    });
  });

  describe("profile configuration merging", () => {
    it("should merge profile configurations correctly", async () => {
      const workspaceDir = resolve(mockCwd, "packages/app");

      mockGlob.mockResolvedValueOnce([workspaceDir]);

      const rootConfig = {
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
        workspaces: {
          "packages/*": { include: ["src/**"] },
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {},
        cwd: mockCwd,
        profileConfig: {
          exclude: ["*.tmp"],
          include: ["lib/**"],
        },
        rootConfig,
      });

      const workspaceResult = result[1];

      expect(workspaceResult?.config.exclude).toContain("*.tmp");
      expect(workspaceResult?.config.exclude).toContain("node_modules");
      expect(workspaceResult?.config.include).toContain("lib/**");
      expect(workspaceResult?.config.include).toContain("**/*");
      expect(workspaceResult?.config.include).toContain("src/**");
    });
  });

  describe("edge cases", () => {
    it("should handle empty workspace patterns", async () => {
      mockGlob.mockResolvedValue([]);

      const rootConfig = {
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
        workspaces: {
          "nonexistent/*": {},
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {},
        cwd: mockCwd,
        profileConfig: {},
        rootConfig,
      });

      expect(result).toHaveLength(1); // only root
      expect(result[0]?.dir).toBe(mockCwd);
      expect(result[0]?.config.exclude).toStrictEqual(["node_modules"]);
    });

    it("should handle workspace directory that matches cwd", async () => {
      mockGlob.mockResolvedValueOnce([mockCwd]);

      const rootConfig = {
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
        workspaces: {
          ".": { exclude: ["temp"] },
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {},
        cwd: mockCwd,
        profileConfig: {},
        rootConfig,
      });

      // Should have root + the workspace that matches root
      expect(result).toHaveLength(2);
      expect(result[0]?.dir).toBe(mockCwd);
      expect(result[1]?.dir).toBe(mockCwd);

      // Root should have normal excludes (no workspace dirs to exclude)
      expect(result[0]?.config.exclude).toStrictEqual(["node_modules"]);

      // Workspace should have merged excludes
      expect(result[1]?.config.exclude).toContain("node_modules");
      expect(result[1]?.config.exclude).toContain("temp");
    });

    it("should handle undefined workspaces", async () => {
      const rootConfig = {
        dryRun: true,
        exclude: ["build"],
        include: ["src/**"],
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: {},
        cwd: mockCwd,
        profileConfig: {},
        rootConfig,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.dir).toBe(mockCwd);
      expect(result[0]?.config).toStrictEqual({
        dryRun: true,
        exclude: ["build"],
        include: ["src/**"],
      });
    });

    it("should deduplicate exclude patterns correctly", async () => {
      const workspaceDir = resolve(mockCwd, "packages/app");

      mockGlob.mockResolvedValueOnce([workspaceDir]);

      const rootConfig = {
        dryRun: false,
        exclude: ["node_modules", "temp"],
        include: ["**/*"],
        workspaces: {
          "packages/*": { exclude: ["temp", "dist"] },
        },
      };

      const result = await resolveWorkspaceConfigs({
        cliConfig: { exclude: ["temp", "logs"] },
        cwd: mockCwd,
        profileConfig: { exclude: ["node_modules"] },
        rootConfig,
      });

      // Verify no duplicate patterns in merged configs
      const workspaceResult = result[1];
      const tempCount = workspaceResult?.config.exclude.filter((p) => {
        return p === "temp";
      }).length;
      const nodeModulesCount = workspaceResult?.config.exclude.filter((p) => {
        return p === "node_modules";
      }).length;

      expect(tempCount).toBe(1);
      expect(nodeModulesCount).toBe(1);
    });
  });
});
