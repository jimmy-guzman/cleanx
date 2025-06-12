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
const { isDynamicPattern } = await import("tinyglobby");

const mockInferWorkspaces = vi.mocked(inferWorkspaces);
const mockIsDynamicPattern = vi.mocked(isDynamicPattern);

describe("resolveWorkspaceConfigs", () => {
  const mockCwd = "/project";

  beforeEach(() => {
    vi.clearAllMocks();
    mockInferWorkspaces.mockResolvedValue([]);
    mockIsDynamicPattern.mockReturnValue(false);
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

    mockInferWorkspaces.mockResolvedValue([
      {
        dir: workspaceDir,
        packageJson: { name: "app", version: "1.0.0" },
        relativeDir: "packages/app",
      },
    ]);

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

    mockInferWorkspaces.mockResolvedValue([
      {
        dir: workspaceDir,
        packageJson: { name: "lib", version: "1.0.0" },
        relativeDir: "packages/lib",
      },
    ]);

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

    mockInferWorkspaces.mockResolvedValue([
      {
        dir: workspaceDir,
        packageJson: { name: "core", version: "1.0.0" },
        relativeDir: "packages/core",
      },
    ]);

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
    mockInferWorkspaces.mockResolvedValue([]);

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
    mockInferWorkspaces.mockResolvedValue([
      {
        dir: "packages/app",
        packageJson: { name: "app", version: "1.0.0" },
        relativeDir: "packages/app",
      },
    ]);

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
    mockInferWorkspaces.mockResolvedValue([
      {
        dir: "packages/app",
        packageJson: { name: "app", version: "1.0.0" },
        relativeDir: "packages/app",
      },
    ]);

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
    mockInferWorkspaces.mockResolvedValue([
      {
        dir: "apps/web",
        packageJson: { name: "web", version: "1.0.0" },
        relativeDir: "apps/web",
      },
      {
        dir: "packages/core",
        packageJson: { name: "core", version: "1.0.0" },
        relativeDir: "packages/core",
      },
    ]);

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

  it("should exclude other workspaces from each workspace config", async () => {
    mockInferWorkspaces.mockResolvedValue([
      {
        dir: "apps/web",
        packageJson: { name: "web", version: "1.0.0" },
        relativeDir: "apps/web",
      },
      {
        dir: "packages/core",
        packageJson: { name: "core", version: "1.0.0" },
        relativeDir: "packages/core",
      },
    ]);

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

    const web = result.find((r) => {
      return r.dir === "apps/web";
    });
    const core = result.find((r) => {
      return r.dir === "packages/core";
    });

    // Each workspace should exclude the other workspace
    expect(web?.config.exclude).toContain("*(../)**/core/**/*");
    expect(core?.config.exclude).toContain("*(../)**/web/**/*");
  });

  it("should exclude workspace directories and package name patterns from root config", async () => {
    mockInferWorkspaces.mockResolvedValue([
      {
        dir: "apps/web",
        packageJson: { name: "web-app", version: "1.0.0" },
        relativeDir: "apps/web",
      },
      {
        dir: "packages/core",
        packageJson: { name: "@company/core", version: "1.0.0" },
        relativeDir: "packages/core",
      },
    ]);

    const rootConfig = {
      dryRun: false,
      exclude: ["*.log"],
      include: ["**/*"],
      workspaces: {},
    };

    const result = await resolveWorkspaceConfigs({
      cliConfig: {},
      cwd: mockCwd,
      profileConfig: {},
      rootConfig,
    });

    const rootResult = result[0];

    // Root should exclude workspace directories
    expect(rootResult?.config.exclude).toContain("apps/web");
    expect(rootResult?.config.exclude).toContain("packages/core");

    // Root should exclude package name patterns
    expect(rootResult?.config.exclude).toContain("**/web-app/**/*");
    expect(rootResult?.config.exclude).toContain("**/@company/core/**/*");

    // Should preserve original excludes
    expect(rootResult?.config.exclude).toContain("*.log");
  });

  it("should handle dynamic pattern matching for workspace overrides", async () => {
    mockIsDynamicPattern.mockImplementation((pattern) => {
      return pattern.includes("*");
    });

    mockInferWorkspaces.mockResolvedValue([
      {
        dir: "apps/web",
        packageJson: { name: "web", version: "1.0.0" },
        relativeDir: "apps/web",
      },
      {
        dir: "apps/mobile",
        packageJson: { name: "mobile", version: "1.0.0" },
        relativeDir: "apps/mobile",
      },
      {
        dir: "packages/core",
        packageJson: { name: "core", version: "1.0.0" },
        relativeDir: "packages/core",
      },
    ]);

    const rootConfig = {
      dryRun: false,
      exclude: [],
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

    const web = result.find((r) => {
      return r.dir === "apps/web";
    });
    const mobile = result.find((r) => {
      return r.dir === "apps/mobile";
    });
    const core = result.find((r) => {
      return r.dir === "packages/core";
    });

    // Apps should get "build" exclusion
    expect(web?.config.exclude).toContain("build");
    expect(mobile?.config.exclude).toContain("build");

    // Packages should get "dist" exclusion
    expect(core?.config.exclude).toContain("dist");
  });

  it("should override workspace exclusions when user provides specific config", async () => {
    mockInferWorkspaces.mockResolvedValue([
      {
        dir: "apps/web",
        packageJson: { name: "web", version: "1.0.0" },
        relativeDir: "apps/web",
      },
      {
        dir: "packages/core",
        packageJson: { name: "core", version: "1.0.0" },
        relativeDir: "packages/core",
      },
    ]);

    const rootConfig = {
      dryRun: false,
      exclude: ["node_modules"],
      include: ["**/*"],
      workspaces: {
        "apps/web": { exclude: ["custom-build"] },
      },
    };

    const result = await resolveWorkspaceConfigs({
      cliConfig: {},
      cwd: mockCwd,
      profileConfig: {},
      rootConfig,
    });

    const web = result.find((r) => {
      return r.dir === "apps/web";
    });
    const core = result.find((r) => {
      return r.dir === "packages/core";
    });

    // Web workspace should have user override (no automatic other-workspace exclusions)
    expect(web?.config.exclude).toContain("node_modules"); // from root
    expect(web?.config.exclude).toContain("custom-build"); // from workspace override
    expect(web?.config.exclude).not.toContain("*(../)**/core/**/*"); // overridden

    // Core workspace should have automatic exclusions (no user override)
    expect(core?.config.exclude).toContain("*(../)**/web/**/*");
  });
});
