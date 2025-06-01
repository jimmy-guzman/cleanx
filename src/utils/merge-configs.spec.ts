import type { CleanxOptions } from "../options";

import { mergeConfigs } from "./merge-configs";

const createMockConfig = (
  overrides: Partial<CleanxOptions> = {},
): CleanxOptions => {
  return {
    dryRun: false,
    exclude: [],
    include: [],
    ...overrides,
  };
};

describe("mergeConfigs", () => {
  it("should merge configs with correct precedence for dryRun", () => {
    const result = mergeConfigs({
      cli: { dryRun: true },
      profile: { dryRun: false },
      root: createMockConfig({ dryRun: false }),
      workspace: { dryRun: false },
    });

    expect(result.dryRun).toBe(true);
  });

  it("should fall back to root config for dryRun when cli is undefined", () => {
    const result = mergeConfigs({
      cli: {},
      profile: { dryRun: false },
      root: createMockConfig({ dryRun: true }),
      workspace: { dryRun: false },
    });

    expect(result.dryRun).toBe(true);
  });

  it("should fall back to profile config for dryRun when cli and root are undefined", () => {
    const result = mergeConfigs({
      cli: {},
      profile: { dryRun: true },
      root: createMockConfig({ dryRun: undefined }), // root must be undefined, not false
      workspace: { dryRun: false },
    });

    expect(result.dryRun).toBe(true);
  });

  it("should default dryRun to false when all sources are undefined", () => {
    const result = mergeConfigs({
      cli: {},
      profile: {},
      root: createMockConfig(),
      workspace: {},
    });

    expect(result.dryRun).toBe(false);
  });

  it("should merge and dedupe exclude arrays in correct order", () => {
    const result = mergeConfigs({
      cli: { exclude: ["cli-exclude", "duplicate"] },
      profile: { exclude: ["profile-exclude"] },
      root: createMockConfig({ exclude: ["root-exclude", "duplicate"] }),
      workspace: { exclude: ["workspace-exclude"] },
    });

    expect(result.exclude).toStrictEqual([
      "profile-exclude",
      "root-exclude",
      "duplicate",
      "workspace-exclude",
      "cli-exclude",
    ]);
  });

  it("should merge and dedupe include arrays in correct order", () => {
    const result = mergeConfigs({
      cli: { include: ["cli-include", "duplicate"] },
      profile: { include: ["profile-include"] },
      root: createMockConfig({ include: ["root-include", "duplicate"] }),
      workspace: { include: ["workspace-include"] },
    });

    expect(result.include).toStrictEqual([
      "profile-include",
      "root-include",
      "duplicate",
      "workspace-include",
      "cli-include",
    ]);
  });

  it("should handle empty arrays gracefully", () => {
    const result = mergeConfigs({
      cli: {},
      profile: {},
      root: createMockConfig(),
      workspace: {},
    });

    expect(result.exclude).toStrictEqual([]);
    expect(result.include).toStrictEqual([]);
  });

  it("should handle undefined arrays gracefully", () => {
    const result = mergeConfigs({
      cli: { exclude: undefined, include: undefined },
      profile: { exclude: undefined, include: undefined },
      root: createMockConfig({ exclude: undefined, include: undefined }),
      workspace: { exclude: undefined, include: undefined },
    });

    expect(result.exclude).toStrictEqual([]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve order within each config source", () => {
    const result = mergeConfigs({
      cli: { exclude: ["c", "d"] },
      profile: {},
      root: createMockConfig({ exclude: ["a", "b"] }),
      workspace: {},
    });

    expect(result.exclude).toStrictEqual(["a", "b", "c", "d"]);
  });

  it("should merge complete realistic config", () => {
    const result = mergeConfigs({
      cli: {
        dryRun: true,
        exclude: ["temp"],
        include: ["dist"],
      },
      profile: {
        exclude: [".cache"],
        include: ["build"],
      },
      root: createMockConfig({
        dryRun: false,
        exclude: [".git", "node_modules"],
        include: ["out", "coverage"],
      }),
      workspace: {
        exclude: ["uploads"],
        include: ["storybook-static"],
      },
    });

    expect(result).toStrictEqual({
      dryRun: true,
      exclude: [".cache", ".git", "node_modules", "uploads", "temp"],
      include: ["build", "out", "coverage", "storybook-static", "dist"],
    });
  });
});
