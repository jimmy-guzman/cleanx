import { BUILTIN_PROFILES } from "../constants";
import { resolveConfigs } from "./resolve-configs";

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

vi.mock("./load-config", () => {
  return {
    loadConfig: vi.fn(),
  };
});

const { inferWorkspaces } = await import("./infer-workspaces");
const { isDynamicPattern } = await import("tinyglobby");
const { loadConfig } = await import("./load-config");

const mockInferWorkspaces = vi.mocked(inferWorkspaces);
const mockIsDynamicPattern = vi.mocked(isDynamicPattern);
const mockLoadConfig = vi.mocked(loadConfig);

describe("resolveConfigs", () => {
  const mockCwd = "/project";

  beforeEach(() => {
    vi.clearAllMocks();
    mockInferWorkspaces.mockResolvedValue([]);
    mockIsDynamicPattern.mockReturnValue(false);
    mockLoadConfig.mockResolvedValue({
      dryRun: false,
      exclude: [],
      include: [],
    });
  });

  describe("Basic Functionality", () => {
    it("should return root config when no workspaces are defined", async () => {
      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      expect(result.workspaces).toHaveLength(1);
      expect(result.workspaces[0]?.dir).toBe(mockCwd);
      expect(result.workspaces[0]?.config).toStrictEqual({
        exclude: [...(BUILTIN_PROFILES.default?.exclude ?? [])],
        include: [...(BUILTIN_PROFILES.default?.include ?? []), "**/*"],
      });
      expect(result.dryRun).toBe(false);
    });

    it("should apply workspace-specific overrides", async () => {
      const workspaceDir = "packages/app";

      mockInferWorkspaces.mockResolvedValue([
        {
          dir: workspaceDir,
          packageJson: { name: "app", version: "1.0.0" },
          relativeDir: "packages/app",
        },
      ]);

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
        workspaces: {
          [workspaceDir]: {
            exclude: ["dist"],
          },
        },
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      expect(result.workspaces).toHaveLength(2);
      const [rootResult, workspaceResult] = result.workspaces;

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

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: ["node_modules"],
        include: ["**/*"],
        profiles: {
          default: {
            exclude: [".cache"],
          },
        },
        workspaces: {
          [workspaceDir]: {
            exclude: ["dist"],
          },
        },
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        exclude: ["temp"],
        profile: "default",
      });

      const workspaceResult = result.workspaces.find((r) => {
        return r.dir === workspaceDir;
      });

      expect(workspaceResult?.config.exclude).toStrictEqual(
        expect.arrayContaining([".cache", "node_modules", "dist", "temp"]),
      );
    });

    it("should deduplicate excluded paths in workspace config", async () => {
      const workspaceDir = "packages/core";

      mockInferWorkspaces.mockResolvedValue([
        {
          dir: workspaceDir,
          packageJson: { name: "core", version: "1.0.0" },
          relativeDir: "packages/core",
        },
      ]);

      mockLoadConfig.mockResolvedValue({
        dryRun: true,
        exclude: ["node_modules", "dist"],
        include: ["**/*"],
        workspaces: {
          [workspaceDir]: {
            exclude: ["dist"],
          },
        },
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        exclude: ["node_modules"],
        profile: "default",
      });

      const workspaceResult = result.workspaces.find((r) => {
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
  });

  describe("Workspace Configuration", () => {
    it("should handle root workspace override with '.' directory", async () => {
      mockInferWorkspaces.mockResolvedValue([]);

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: ["*.log"],
        include: ["src/**"],
        workspaces: {
          ".": {
            exclude: [".cache"],
          },
        },
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      expect(result.workspaces).toHaveLength(1);
      expect(result.workspaces[0]?.dir).toBe(mockCwd);
      expect(result.workspaces[0]?.config.exclude).toStrictEqual(
        expect.arrayContaining(["*.log", ".cache"]),
      );
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

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: ["*.log"],
        include: ["**/*"],
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      const rootResult = result.workspaces[0];

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

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: [],
        include: ["**/*"],
        workspaces: {
          "apps/*": { exclude: ["build"] },
          "packages/*": { exclude: ["dist"] },
        },
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      const web = result.workspaces.find((r) => {
        return r.dir === "apps/web";
      });
      const mobile = result.workspaces.find((r) => {
        return r.dir === "apps/mobile";
      });
      const core = result.workspaces.find((r) => {
        return r.dir === "packages/core";
      });

      // Apps should get "build" exclusion
      expect(web?.config.exclude).toContain("build");
      expect(mobile?.config.exclude).toContain("build");

      // Packages should get "dist" exclusion
      expect(core?.config.exclude).toContain("dist");
    });
  });

  describe("Profile and DryRun Resolution", () => {
    it("should handle dryRun precedence correctly", async () => {
      // CLI should override everything
      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: [],
        include: [],
        profiles: {
          default: { dryRun: true },
        },
      });

      const result1 = await resolveConfigs({
        cwd: mockCwd,
        dryRun: false,
        profile: "default",
      });

      expect(result1.dryRun).toBe(false);

      // Root config should override profile
      mockLoadConfig.mockResolvedValue({
        dryRun: true,
        exclude: [],
        include: [],
        profiles: {
          default: { dryRun: false },
        },
      });

      const result2 = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      expect(result2.dryRun).toBe(true);

      // Profile should be used when root is undefined
      mockLoadConfig.mockResolvedValue({
        exclude: [],
        include: [],
        profiles: {
          default: { dryRun: true },
        },
      });

      const result3 = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      expect(result3.dryRun).toBe(true);
    });

    it("should handle profile resolution correctly", async () => {
      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: [],
        include: [],
        profiles: {
          default: {
            exclude: ["user-override"],
            include: ["user-include"],
          },
        },
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      const rootResult = result.workspaces[0];

      // User profile should override builtin profile
      expect(rootResult?.config.exclude).toContain("user-override");
      expect(rootResult?.config.include).toContain("user-include");
    });
  });

  describe("Workspace Deletion Prevention", () => {
    it("should prevent root from deleting workspace directories", async () => {
      mockInferWorkspaces.mockResolvedValue([
        {
          dir: "packages/core",
          packageJson: { name: "core", version: "1.0.0" },
          relativeDir: "packages/core",
        },
        {
          dir: "apps/web",
          packageJson: { name: "web", version: "1.0.0" },
          relativeDir: "apps/web",
        },
      ]);

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: [],
        include: ["**/*"], // This could match workspace dirs!
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      const rootConfig = result.workspaces[0];

      // ROOT MUST EXCLUDE ALL WORKSPACE DIRECTORIES
      expect(rootConfig?.config.exclude).toContain("packages/core");
      expect(rootConfig?.config.exclude).toContain("apps/web");
      expect(rootConfig?.config.exclude).toContain("**/core/**/*");
      expect(rootConfig?.config.exclude).toContain("**/web/**/*");
    });

    it("should prevent workspaces from deleting each other", async () => {
      mockInferWorkspaces.mockResolvedValue([
        {
          dir: "packages/ui",
          packageJson: { name: "@company/ui", version: "1.0.0" },
          relativeDir: "packages/ui",
        },
        {
          dir: "packages/api",
          packageJson: { name: "@company/api", version: "1.0.0" },
          relativeDir: "packages/api",
        },
      ]);

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: [],
        include: ["**/*"], // Dangerous - could match other workspaces
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      const uiWorkspace = result.workspaces.find((w) => {
        return w.dir === "packages/ui";
      });
      const apiWorkspace = result.workspaces.find((w) => {
        return w.dir === "packages/api";
      });

      // EACH WORKSPACE MUST EXCLUDE ALL OTHER WORKSPACES
      expect(uiWorkspace?.config.exclude).toContain(
        "*(../)**/@company/api/**/*",
      );
      expect(apiWorkspace?.config.exclude).toContain(
        "*(../)**/@company/ui/**/*",
      );
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

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: [],
        include: ["**/*"],
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      const web = result.workspaces.find((r) => {
        return r.dir === "apps/web";
      });
      const core = result.workspaces.find((r) => {
        return r.dir === "packages/core";
      });

      // Each workspace should exclude the other workspace
      expect(web?.config.exclude).toContain("*(../)**/core/**/*");
      expect(core?.config.exclude).toContain("*(../)**/web/**/*");
    });

    it("should preserve workspace exclusions even with user overrides", async () => {
      mockInferWorkspaces.mockResolvedValue([
        {
          dir: "apps/critical",
          packageJson: { name: "critical-app", version: "1.0.0" },
          relativeDir: "apps/critical",
        },
      ]);

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: [],
        include: ["**/*"],
        workspaces: {
          ".": {
            exclude: [], // User tries to remove all exclusions!
          },
        },
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      const rootConfig = result.workspaces[0];

      // Even with user trying to remove exclusions, workspace dirs MUST be excluded
      expect(rootConfig?.config.exclude).toContain("apps/critical");
      expect(rootConfig?.config.exclude).toContain("**/critical-app/**/*");
    });
  });

  describe("Edge Cases", () => {
    it("should default dryRun to false when not specified", async () => {
      mockLoadConfig.mockResolvedValue({
        exclude: [],
        include: [],
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      expect(result.dryRun).toBe(false);
    });

    it("should handle workspace inference correctly", async () => {
      mockInferWorkspaces.mockResolvedValue([
        {
          dir: "packages/lib1",
          packageJson: { name: "lib1", version: "1.0.0" },
          relativeDir: "packages/lib1",
        },
        {
          dir: "packages/lib2",
          packageJson: { name: "lib2", version: "1.0.0" },
          relativeDir: "packages/lib2",
        },
      ]);

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: [],
        include: ["**/*"],
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      // Should have root + 2 inferred workspaces
      expect(result.workspaces).toHaveLength(3);
      expect(
        result.workspaces.map((w) => {
          return w.dir;
        }),
      ).toContain("packages/lib1");
      expect(
        result.workspaces.map((w) => {
          return w.dir;
        }),
      ).toContain("packages/lib2");
      expect(
        result.workspaces.map((w) => {
          return w.dir;
        }),
      ).toContain(mockCwd);
    });

    it("should handle workspace overrides that don't match existing workspaces", async () => {
      mockInferWorkspaces.mockResolvedValue([
        {
          dir: "packages/real",
          packageJson: { name: "real", version: "1.0.0" },
          relativeDir: "packages/real",
        },
      ]);

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: [],
        include: ["**/*"],
        workspaces: {
          "packages/nonexistent": {
            exclude: ["should-be-ignored"],
          },
          "packages/real": {
            exclude: ["should-be-applied"],
          },
        },
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      const realWorkspace = result.workspaces.find((w) => {
        return w.dir === "packages/real";
      });

      // Should apply config for existing workspace
      expect(realWorkspace?.config.exclude).toContain("should-be-applied");

      // Should not crash or create phantom workspaces for nonexistent ones
      expect(
        result.workspaces.find((w) => {
          return w.dir === "packages/nonexistent";
        }),
      ).toBeUndefined();
    });

    it("should handle empty/undefined profiles gracefully", async () => {
      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: [],
        include: [],
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "nonexistent",
      });

      // Should not crash and should provide sensible defaults
      expect(result.dryRun).toBe(false);
      expect(result.workspaces).toHaveLength(1);
    });

    it("should handle workspace names that could be dangerous patterns", async () => {
      mockInferWorkspaces.mockResolvedValue([
        {
          dir: "packages/build",
          packageJson: { name: "build-tools", version: "1.0.0" },
          relativeDir: "packages/build",
        },
        {
          dir: "packages/dist",
          packageJson: { name: "dist-utils", version: "1.0.0" },
          relativeDir: "packages/dist",
        },
      ]);

      mockLoadConfig.mockResolvedValue({
        dryRun: false,
        exclude: [],
        include: ["build/**", "dist/**"], // Dangerous patterns
      });

      const result = await resolveConfigs({
        cwd: mockCwd,
        profile: "default",
      });

      const rootConfig = result.workspaces[0];

      // Root must specifically exclude these workspace directories
      expect(rootConfig?.config.exclude).toContain("packages/build");
      expect(rootConfig?.config.exclude).toContain("packages/dist");
    });
  });
});
