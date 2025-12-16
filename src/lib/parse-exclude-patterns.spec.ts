import { parseExcludePatterns } from "./parse-exclude-patterns";

describe("parseExcludePatterns", () => {
  it("should preserve patterns that already contain **", () => {
    const result = parseExcludePatterns([
      "dist/**",
      "**/node_modules/**",
      "src/**/*.js",
    ]);

    expect(result.exclude).toStrictEqual([
      "dist/**",
      "**/node_modules/**",
      "src/**/*.js",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should add ** to directory patterns ending with /", () => {
    const result = parseExcludePatterns(["dist/", "node_modules/", "build/"]);

    expect(result.exclude).toStrictEqual([
      "dist/**",
      "node_modules/**",
      "build/**",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should add /** to plain directory names", () => {
    const result = parseExcludePatterns(["dist", "node_modules", "build"]);

    expect(result.exclude).toStrictEqual([
      "dist/**",
      "node_modules/**",
      "build/**",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should handle nested directory paths", () => {
    const result = parseExcludePatterns([
      "src/dist",
      "packages/app/dist",
      "packages/app/dist/",
    ]);

    expect(result.exclude).toStrictEqual([
      "src/dist/**",
      "packages/app/dist/**",
      "packages/app/dist/**",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve file glob patterns with asterisk", () => {
    const result = parseExcludePatterns(["*.log", "*.js", "test-*.json"]);

    expect(result.exclude).toStrictEqual(["*.log", "*.js", "test-*.json"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve file patterns with extensions", () => {
    const result = parseExcludePatterns([
      ".env.local",
      ".DS_Store",
      "package-lock.json",
    ]);

    expect(result.exclude).toStrictEqual([
      ".env.local",
      ".DS_Store",
      "package-lock.json",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve question mark glob patterns", () => {
    const result = parseExcludePatterns(["file?.txt", "test?.log"]);

    expect(result.exclude).toStrictEqual(["file?.txt", "test?.log"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve bracket glob patterns", () => {
    const result = parseExcludePatterns(["file[0-9].txt", "[abc].log"]);

    expect(result.exclude).toStrictEqual(["file[0-9].txt", "[abc].log"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve nested file patterns", () => {
    const result = parseExcludePatterns(["src/*.js", "logs/*.log"]);

    expect(result.exclude).toStrictEqual(["src/*.js", "logs/*.log"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve exact filenames with extensions", () => {
    const result = parseExcludePatterns([
      "README.md",
      ".gitignore",
      "package.json",
    ]);

    expect(result.exclude).toStrictEqual([
      "README.md",
      ".gitignore",
      "package.json",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve dotfiles", () => {
    const result = parseExcludePatterns([".env", ".npmrc", ".eslintrc"]);

    expect(result.exclude).toStrictEqual([".env", ".npmrc", ".eslintrc"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should normalize Windows backslashes to forward slashes", () => {
    const result = parseExcludePatterns([
      String.raw`dist\build`,
      "node_modules\\",
      String.raw`src\**\*.js`,
      String.raw`logs\*.log`,
    ]);

    expect(result.exclude).toStrictEqual([
      "dist/build/**",
      "node_modules/**",
      "src/**/*.js",
      "logs/*.log",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should handle root path", () => {
    const result = parseExcludePatterns(["/"]);

    expect(result.exclude).toStrictEqual(["/**"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should convert negation patterns to include", () => {
    const result = parseExcludePatterns(["!.env.example", "!dist/keep.js"]);

    expect(result.exclude).toStrictEqual([]);
    expect(result.include).toStrictEqual([".env.example", "dist/keep.js"]);
  });

  it("should handle mix of regular and negation patterns", () => {
    const result = parseExcludePatterns([
      ".env*",
      "!.env.example",
      "node_modules",
      "!node_modules/.cache/**",
    ]);

    expect(result.exclude).toStrictEqual([".env*", "node_modules/**"]);
    expect(result.include).toStrictEqual([
      ".env.example",
      "node_modules/.cache/**",
    ]);
  });

  it("should not normalize include patterns from negations", () => {
    const result = parseExcludePatterns(["dist", "!dist/keep"]);

    expect(result.exclude).toStrictEqual(["dist/**"]);
    expect(result.include).toStrictEqual(["dist/keep"]);
  });

  it("should preserve file patterns in negations", () => {
    const result = parseExcludePatterns(["*.log", "!important.log"]);

    expect(result.exclude).toStrictEqual(["*.log"]);
    expect(result.include).toStrictEqual(["important.log"]);
  });

  it("should handle empty array", () => {
    const result = parseExcludePatterns([]);

    expect(result.exclude).toStrictEqual([]);
    expect(result.include).toStrictEqual([]);
  });

  it("should normalize backslashes in negation patterns", () => {
    const result = parseExcludePatterns([
      "dist",
      String.raw`!dist\keep`,
      "node_modules",
      String.raw`!node_modules\.cache`,
    ]);

    expect(result.exclude).toStrictEqual(["dist/**", "node_modules/**"]);
    expect(result.include).toStrictEqual(["dist/keep", "node_modules/.cache"]);
  });
});
