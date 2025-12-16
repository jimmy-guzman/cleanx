import { normalizeExcludePattern } from "./normalize-exclude-pattern";

describe("normalizeExcludePattern", () => {
  it("should preserve patterns that already contain **", () => {
    expect(normalizeExcludePattern("dist/**")).toBe("dist/**");
    expect(normalizeExcludePattern("**/node_modules/**")).toBe(
      "**/node_modules/**",
    );
    expect(normalizeExcludePattern("src/**/*.js")).toBe("src/**/*.js");
  });

  it("should add ** to patterns ending with /", () => {
    expect(normalizeExcludePattern("dist/")).toBe("dist/**");
    expect(normalizeExcludePattern("node_modules/")).toBe("node_modules/**");
    expect(normalizeExcludePattern("build/")).toBe("build/**");
  });

  it("should add /** to plain directory names", () => {
    expect(normalizeExcludePattern("dist")).toBe("dist/**");
    expect(normalizeExcludePattern("node_modules")).toBe("node_modules/**");
    expect(normalizeExcludePattern("build")).toBe("build/**");
  });

  it("should normalize Windows backslashes to forward slashes", () => {
    expect(normalizeExcludePattern(String.raw`dist\build`)).toBe(
      "dist/build/**",
    );
    expect(normalizeExcludePattern("node_modules\\")).toBe("node_modules/**");
    expect(normalizeExcludePattern(String.raw`src\**\*.js`)).toBe(
      "src/**/*.js",
    );
  });

  it("should handle nested paths", () => {
    expect(normalizeExcludePattern("src/dist")).toBe("src/dist/**");
    expect(normalizeExcludePattern("packages/app/dist/")).toBe(
      "packages/app/dist/**",
    );
  });

  it("should handle single character patterns", () => {
    expect(normalizeExcludePattern("*")).toBe("*/**");
    expect(normalizeExcludePattern("?")).toBe("?/**");
  });

  it("should handle empty string", () => {
    expect(normalizeExcludePattern("")).toBe("/**");
  });
});
