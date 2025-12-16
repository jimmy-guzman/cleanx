import { normalizeExcludePattern } from "./normalize-exclude-pattern";

describe("normalizeExcludePattern", () => {
  it("should preserve patterns that already contain **", () => {
    expect(normalizeExcludePattern("dist/**")).toBe("dist/**");
    expect(normalizeExcludePattern("**/node_modules/**")).toBe(
      "**/node_modules/**",
    );
    expect(normalizeExcludePattern("src/**/*.js")).toBe("src/**/*.js");
  });

  it("should add ** to directory patterns ending with /", () => {
    expect(normalizeExcludePattern("dist/")).toBe("dist/**");
    expect(normalizeExcludePattern("node_modules/")).toBe("node_modules/**");
    expect(normalizeExcludePattern("build/")).toBe("build/**");
  });

  it("should add /** to plain directory names", () => {
    expect(normalizeExcludePattern("dist")).toBe("dist/**");
    expect(normalizeExcludePattern("node_modules")).toBe("node_modules/**");
    expect(normalizeExcludePattern("build")).toBe("build/**");
  });

  it("should handle nested directory paths", () => {
    expect(normalizeExcludePattern("src/dist")).toBe("src/dist/**");
    expect(normalizeExcludePattern("packages/app/dist")).toBe(
      "packages/app/dist/**",
    );
    expect(normalizeExcludePattern("packages/app/dist/")).toBe(
      "packages/app/dist/**",
    );
  });

  it("should preserve file glob patterns with asterisk", () => {
    expect(normalizeExcludePattern("*.log")).toBe("*.log");
    expect(normalizeExcludePattern("*.js")).toBe("*.js");
    expect(normalizeExcludePattern("test-*.json")).toBe("test-*.json");
  });

  it("should preserve file patterns with extensions", () => {
    expect(normalizeExcludePattern(".env.local")).toBe(".env.local");
    expect(normalizeExcludePattern(".DS_Store")).toBe(".DS_Store");
    expect(normalizeExcludePattern("package-lock.json")).toBe(
      "package-lock.json",
    );
  });

  it("should preserve question mark glob patterns", () => {
    expect(normalizeExcludePattern("file?.txt")).toBe("file?.txt");
    expect(normalizeExcludePattern("test?.log")).toBe("test?.log");
  });

  it("should preserve bracket glob patterns", () => {
    expect(normalizeExcludePattern("file[0-9].txt")).toBe("file[0-9].txt");
    expect(normalizeExcludePattern("[abc].log")).toBe("[abc].log");
  });

  it("should preserve nested file patterns", () => {
    expect(normalizeExcludePattern("src/*.js")).toBe("src/*.js");
    expect(normalizeExcludePattern("logs/*.log")).toBe("logs/*.log");
  });

  it("should preserve exact filenames with extensions", () => {
    expect(normalizeExcludePattern("README.md")).toBe("README.md");
    expect(normalizeExcludePattern(".gitignore")).toBe(".gitignore");
    expect(normalizeExcludePattern("package.json")).toBe("package.json");
  });

  it("should preserve dotfiles", () => {
    expect(normalizeExcludePattern(".env")).toBe(".env");
    expect(normalizeExcludePattern(".npmrc")).toBe(".npmrc");
    expect(normalizeExcludePattern(".eslintrc")).toBe(".eslintrc");
  });

  it("should normalize Windows backslashes to forward slashes", () => {
    expect(normalizeExcludePattern(String.raw`dist\build`)).toBe(
      "dist/build/**",
    );
    expect(normalizeExcludePattern("node_modules\\")).toBe("node_modules/**");
    expect(normalizeExcludePattern(String.raw`src\**\*.js`)).toBe(
      "src/**/*.js",
    );
    expect(normalizeExcludePattern(String.raw`logs\*.log`)).toBe("logs/*.log");
  });

  it("should handle root path", () => {
    expect(normalizeExcludePattern("/")).toBe("/**");
  });
});
