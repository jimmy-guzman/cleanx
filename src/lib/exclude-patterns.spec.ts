import { excludePatterns } from "./exclude-patterns";

describe("excludePatterns", () => {
  it("should return empty array when both exclude and include are empty", () => {
    expect(excludePatterns([], [])).toStrictEqual([]);
  });

  it("should return exclude patterns as-is", () => {
    expect(excludePatterns(["node_modules/**", "*.log"], [])).toStrictEqual([
      "node_modules/**",
      "*.log",
    ]);
  });

  it("should negate simple include patterns", () => {
    expect(excludePatterns([], ["*.env"])).toStrictEqual(["!*.env"]);
  });

  it("should expand /** patterns to include directory and contents", () => {
    expect(excludePatterns([], ["node_modules/.cache/**"])).toStrictEqual([
      "!node_modules/.cache",
      "!node_modules/.cache/**",
    ]);
  });

  it("should handle multiple include patterns", () => {
    expect(
      excludePatterns([], ["node_modules/.cache/**", "*.env.example"]),
    ).toStrictEqual([
      "!node_modules/.cache",
      "!node_modules/.cache/**",
      "!*.env.example",
    ]);
  });

  it("should combine exclude and negated include patterns", () => {
    expect(
      excludePatterns(
        ["node_modules/**", ".env*"],
        ["node_modules/.cache/**", ".env.example"],
      ),
    ).toStrictEqual([
      "node_modules/**",
      ".env*",
      "!node_modules/.cache",
      "!node_modules/.cache/**",
      "!.env.example",
    ]);
  });

  it("should normalize Windows backslashes to forward slashes", () => {
    expect(
      excludePatterns([], [String.raw`node_modules\.cache\**`]),
    ).toStrictEqual(["!node_modules/.cache", "!node_modules/.cache/**"]);
  });

  it("should handle mixed separators", () => {
    expect(
      excludePatterns([], [String.raw`node_modules\.cache/**`]),
    ).toStrictEqual(["!node_modules/.cache", "!node_modules/.cache/**"]);
  });

  it("should preserve forward slashes", () => {
    expect(excludePatterns([], ["node_modules/.cache/**"])).toStrictEqual([
      "!node_modules/.cache",
      "!node_modules/.cache/**",
    ]);
  });

  it("should handle patterns without /** suffix", () => {
    expect(excludePatterns([], ["node_modules"])).toStrictEqual([
      "!node_modules",
    ]);
  });

  it("should handle patterns with /* suffix", () => {
    expect(excludePatterns([], ["node_modules/*"])).toStrictEqual([
      "!node_modules/*",
    ]);
  });

  it("should handle deeply nested /** patterns", () => {
    expect(excludePatterns([], ["a/b/c/d/**"])).toStrictEqual([
      "!a/b/c/d",
      "!a/b/c/d/**",
    ]);
  });

  it("should handle root-level /** patterns", () => {
    expect(excludePatterns([], [".cache/**"])).toStrictEqual([
      "!.cache",
      "!.cache/**",
    ]);
  });

  it("should preserve exclude patterns order", () => {
    expect(excludePatterns(["first", "second", "third"], [])).toStrictEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("should preserve include patterns order", () => {
    expect(excludePatterns([], ["first/**", "second/**"])).toStrictEqual([
      "!first",
      "!first/**",
      "!second",
      "!second/**",
    ]);
  });
});
