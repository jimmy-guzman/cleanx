import type { CleanxOptions } from "../options";

import { BUILTIN_PROFILES } from "../constants";
import { resolveProfile } from "./resolve-profile";

const createMockRootConfig = (
  overrides: Partial<CleanxOptions> = {},
): CleanxOptions => {
  return {
    dryRun: false,
    exclude: [],
    include: [],
    ...overrides,
  };
};

describe("resolveProfile", () => {
  it("should return builtin profile when it exists", () => {
    const rootConfig = createMockRootConfig();

    const result = resolveProfile({
      profile: "default",
      rootConfig,
    });

    expect(result).toStrictEqual(BUILTIN_PROFILES.default);
  });

  it("should return empty object when profile does not exist", () => {
    const rootConfig = createMockRootConfig();

    const result = resolveProfile({
      profile: "nonexistent",
      rootConfig,
    });

    expect(result).toStrictEqual({});
  });

  it("should merge user override with builtin profile", () => {
    const rootConfig = createMockRootConfig({
      profiles: {
        default: {
          exclude: ["custom-exclude"],
          include: ["custom-include"],
        },
      },
    });

    const result = resolveProfile({
      profile: "default",
      rootConfig,
    });

    expect(result).toStrictEqual({
      exclude: ["custom-exclude"],
      include: ["custom-include"],
    });
  });

  it("should prioritize user override over builtin profile", () => {
    const rootConfig = createMockRootConfig({
      profiles: {
        default: {
          exclude: ["user-override"],
        },
      },
    });

    const result = resolveProfile({
      profile: "default",
      rootConfig,
    });

    expect(result).toStrictEqual({
      exclude: ["user-override"],
      include: BUILTIN_PROFILES.default?.include,
    });
  });

  it("should handle user-defined profile with no builtin equivalent", () => {
    const rootConfig = createMockRootConfig({
      profiles: {
        custom: {
          dryRun: true,
          exclude: ["custom-exclude"],
          include: ["custom-include"],
        },
      },
    });

    const result = resolveProfile({
      profile: "custom",
      rootConfig,
    });

    expect(result).toStrictEqual({
      dryRun: true,
      exclude: ["custom-exclude"],
      include: ["custom-include"],
    });
  });

  it("should handle rootConfig without profiles property", () => {
    const rootConfig = createMockRootConfig();

    const result = resolveProfile({
      profile: "default",
      rootConfig,
    });

    expect(result).toStrictEqual(BUILTIN_PROFILES.default);
  });

  it("should return builtin full profile", () => {
    const rootConfig = createMockRootConfig();

    const result = resolveProfile({
      profile: "full",
      rootConfig,
    });

    expect(result).toStrictEqual(BUILTIN_PROFILES.full);
  });

  it("should handle partial user override", () => {
    const rootConfig = createMockRootConfig({
      profiles: {
        default: {
          dryRun: true,
          // Only override dryRun, not exclude/include
        },
      },
    });

    const result = resolveProfile({
      profile: "default",
      rootConfig,
    });

    expect(result).toStrictEqual({
      ...BUILTIN_PROFILES.default,
      dryRun: true,
    });
  });

  it("should handle empty user profile override", () => {
    const rootConfig = createMockRootConfig({
      profiles: {
        default: {},
      },
    });

    const result = resolveProfile({
      profile: "default",
      rootConfig,
    });

    expect(result).toStrictEqual(BUILTIN_PROFILES.default);
  });
});
