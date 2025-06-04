import { resolveWorkspaceConfigs } from "./resolve-workspace-configs";

vi.mock("tinyglobby", () => {
  return {
    glob: vi.fn(),
    isDynamicPattern: vi.fn(),
  };
});

vi.mock("./infer-workspaces", () => {
  return {
    inferWorkspaces: vi.fn(),
  };
});

const { inferWorkspaces } = await import("./infer-workspaces");

const mockInferWorkspaces = vi.mocked(inferWorkspaces);

describe("resolveWorkspaceConfigs", () => {
  const mockCwd = "/project";

  beforeEach(() => {
    vi.clearAllMocks();
    mockInferWorkspaces.mockResolvedValue({});
  });

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

    expect(mockInferWorkspaces).toHaveBeenCalledWith(mockCwd);
  });

  it("should apply user overrides to inferred workspaces", async () => {
    const workspaceDir = "packages/app";

    mockInferWorkspaces.mockResolvedValue({
      [workspaceDir]: {},
    });

    const rootConfig = {
      dryRun: false,
      exclude: ["node_modules"],
      include: ["**/*"],
      workspaces: {
        [workspaceDir]: {
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

    expect(result).toHaveLength(2);
    const rootResult = result[0];
    const workspaceResult = result[1];

    expect(rootResult?.dir).toBe(mockCwd);
    expect(rootResult?.config.exclude).toContain("packages/app");

    expect(workspaceResult?.dir).toBe("packages/app");
    expect(workspaceResult?.config.exclude).toContain("node_modules");
    expect(workspaceResult?.config.exclude).toContain("dist");
  });

  it("should merge CLI, profile, root, and workspace configs", async () => {
    const workspaceDir = "packages/lib";

    mockInferWorkspaces.mockResolvedValue({
      [workspaceDir]: {},
    });

    const rootConfig = {
      dryRun: false,
      exclude: ["node_modules"],
      include: ["**/*"],
      workspaces: {
        [workspaceDir]: {
          exclude: ["dist"],
        },
      },
    };

    const result = await resolveWorkspaceConfigs({
      cliConfig: {
        exclude: ["temp"],
      },
      cwd: mockCwd,
      profileConfig: {
        exclude: [".cache"],
      },
      rootConfig,
    });

    const workspaceResult = result.find((r) => {
      return r.dir === workspaceDir;
    });

    expect(workspaceResult?.config.exclude).toStrictEqual(
      expect.arrayContaining(["node_modules", "dist", "temp", ".cache"]),
    );
  });

  it("should dedupe excluded paths in workspace config", async () => {
    const workspaceDir = "packages/core";

    mockInferWorkspaces.mockResolvedValue({
      [workspaceDir]: {},
    });

    const rootConfig = {
      dryRun: true,
      exclude: ["node_modules", "dist"],
      include: ["**/*"],
      workspaces: {
        [workspaceDir]: {
          exclude: ["dist"],
        },
      },
    };

    const result = await resolveWorkspaceConfigs({
      cliConfig: {
        exclude: ["node_modules"],
      },
      cwd: mockCwd,
      profileConfig: {},
      rootConfig,
    });

    const workspaceResult = result.find((r) => {
      return r.dir === workspaceDir;
    });
    const exclude = workspaceResult?.config.exclude ?? [];
    const nodeModulesCount = exclude.filter((x) => {
      return x === "node_modules";
    }).length;
    const distCount = exclude.filter((x) => {
      return x === "dist";
    }).length;

    expect(nodeModulesCount).toBe(1);
    expect(distCount).toBe(1);
  });

  it("should handle '.' workspace override separately", async () => {
    mockInferWorkspaces.mockResolvedValue({});

    const rootConfig = {
      dryRun: false,
      exclude: ["*.log"],
      include: ["src/**"],
      workspaces: {
        ".": {
          exclude: [".cache"],
        },
      },
    };

    const result = await resolveWorkspaceConfigs({
      cliConfig: {},
      cwd: mockCwd,
      profileConfig: {},
      rootConfig,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.dir).toBe(mockCwd);
    expect(result[0]?.config.exclude).toStrictEqual(
      expect.arrayContaining(["*.log", ".cache"]),
    );
  });

  it("should infer workspaces when config is missing or empty", async () => {
    mockInferWorkspaces.mockResolvedValue({
      "packages/app": {},
    });

    const rootConfig = {
      dryRun: false,
      exclude: [],
      include: ["**/*"],
      workspaces: {},
    };

    const result = await resolveWorkspaceConfigs({
      cliConfig: {},
      cwd: mockCwd,
      profileConfig: {},
      rootConfig,
    });

    expect(mockInferWorkspaces).toHaveBeenCalledWith(mockCwd);
    expect(result).toHaveLength(2);
  });

  it("should ignore workspace overrides that don't match any inferred paths", async () => {
    mockInferWorkspaces.mockResolvedValue({
      "packages/app": {},
    });

    const rootConfig = {
      dryRun: false,
      exclude: [],
      include: ["**/*"],
      workspaces: {
        "nonexistent/path": { exclude: ["ignored"] },
      },
    };

    const result = await resolveWorkspaceConfigs({
      cliConfig: {},
      cwd: mockCwd,
      profileConfig: {},
      rootConfig,
    });

    expect(result).toHaveLength(2);
    const workspace = result.find((r) => {
      return r.dir === "packages/app";
    });

    expect(workspace?.config.exclude).not.toContain("ignored");
  });

  it("should apply multiple workspace overrides correctly", async () => {
    mockInferWorkspaces.mockResolvedValue({
      "apps/web": {},
      "packages/core": {},
    });

    const rootConfig = {
      dryRun: false,
      exclude: [],
      include: ["**/*"],
      workspaces: {
        "apps/web": { exclude: ["build"] },
        "packages/core": { exclude: ["dist"] },
      },
    };

    const result = await resolveWorkspaceConfigs({
      cliConfig: {},
      cwd: mockCwd,
      profileConfig: {},
      rootConfig,
    });

    expect(result).toHaveLength(3);

    const web = result.find((r) => {
      return r.dir === "apps/web";
    });
    const core = result.find((r) => {
      return r.dir === "packages/core";
    });

    expect(web?.config.exclude).toContain("build");
    expect(core?.config.exclude).toContain("dist");
  });

  it("should handle workspace that matches the root directory", async () => {
    mockInferWorkspaces.mockResolvedValue({
      [mockCwd]: {},
    });

    const rootConfig = {
      dryRun: true,
      exclude: [],
      include: ["**/*"],
      workspaces: {
        [mockCwd]: { exclude: ["dist"] },
      },
    };

    const result = await resolveWorkspaceConfigs({
      cliConfig: {},
      cwd: mockCwd,
      profileConfig: {},
      rootConfig,
    });

    const root = result[0];
    const workspace = result[1];

    expect(root?.config.exclude).not.toContain(mockCwd);
    expect(workspace?.dir).toBe(mockCwd);
    expect(workspace?.config.exclude).toContain("dist");
  });
});
