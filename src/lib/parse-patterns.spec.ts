import { parsePatterns } from "./parse-patterns";

describe("parsePatterns", () => {
  it("should preserve patterns that already contain **", () => {
    const result = parsePatterns(
      ["dist/**", "**/node_modules/**", "src/**/*.js"],
      [],
    );

    expect(result.exclude).toStrictEqual([
      "dist/**",
      "**/node_modules/**",
      "src/**/*.js",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should add ** to directory patterns ending with /", () => {
    const result = parsePatterns(["dist/", "node_modules/", "build/"], []);

    expect(result.exclude).toStrictEqual([
      "dist/**",
      "node_modules/**",
      "build/**",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should add /** to plain directory names", () => {
    const result = parsePatterns(["dist", "node_modules", "build"], []);

    expect(result.exclude).toStrictEqual([
      "dist/**",
      "node_modules/**",
      "build/**",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should handle nested directory paths", () => {
    const result = parsePatterns(
      ["src/dist", "packages/app/dist", "packages/app/dist/"],
      [],
    );

    expect(result.exclude).toStrictEqual([
      "src/dist/**",
      "packages/app/dist/**",
      "packages/app/dist/**",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve file glob patterns with asterisk", () => {
    const result = parsePatterns(["*.log", "*.js", "test-*.json"], []);

    expect(result.exclude).toStrictEqual(["*.log", "*.js", "test-*.json"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve file patterns with extensions", () => {
    const result = parsePatterns(
      [".env.local", ".DS_Store", "package-lock.json"],
      [],
    );

    expect(result.exclude).toStrictEqual([
      ".env.local",
      ".DS_Store",
      "package-lock.json",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve question mark glob patterns", () => {
    const result = parsePatterns(["file?.txt", "test?.log"], []);

    expect(result.exclude).toStrictEqual(["file?.txt", "test?.log"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve bracket glob patterns", () => {
    const result = parsePatterns(["file[0-9].txt", "[abc].log"], []);

    expect(result.exclude).toStrictEqual(["file[0-9].txt", "[abc].log"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve nested file patterns", () => {
    const result = parsePatterns(["src/*.js", "logs/*.log"], []);

    expect(result.exclude).toStrictEqual(["src/*.js", "logs/*.log"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve exact filenames with extensions", () => {
    const result = parsePatterns(
      ["README.md", ".gitignore", "package.json"],
      [],
    );

    expect(result.exclude).toStrictEqual([
      "README.md",
      ".gitignore",
      "package.json",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve dotfiles", () => {
    const result = parsePatterns([".env", ".npmrc", ".eslintrc"], []);

    expect(result.exclude).toStrictEqual([".env", ".npmrc", ".eslintrc"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should normalize Windows backslashes to forward slashes", () => {
    const result = parsePatterns(
      [
        String.raw`dist\build`,
        "node_modules\\",
        String.raw`src\**\*.js`,
        String.raw`logs\*.log`,
      ],
      [],
    );

    expect(result.exclude).toStrictEqual([
      "dist/build/**",
      "node_modules/**",
      "src/**/*.js",
      "logs/*.log",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should handle root path", () => {
    const result = parsePatterns(["/"], []);

    expect(result.exclude).toStrictEqual(["/**"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should convert negation patterns to include", () => {
    const result = parsePatterns(["!.env.example", "!dist/keep.js"], []);

    expect(result.exclude).toStrictEqual([]);
    expect(result.include).toStrictEqual([".env.example", "dist/keep.js"]);
  });

  it("should handle mix of regular and negation patterns", () => {
    const result = parsePatterns(
      [".env*", "!.env.example", "node_modules", "!node_modules/.cache/**"],
      [],
    );

    expect(result.exclude).toStrictEqual([".env*", "node_modules/**"]);
    expect(result.include).toStrictEqual([
      ".env.example",
      "node_modules/.cache/**",
    ]);
  });

  it("should not normalize include patterns from negations", () => {
    const result = parsePatterns(["dist", "!dist/keep"], []);

    expect(result.exclude).toStrictEqual(["dist/**"]);
    expect(result.include).toStrictEqual(["dist/keep"]);
  });

  it("should preserve file patterns in negations", () => {
    const result = parsePatterns(["*.log", "!important.log"], []);

    expect(result.exclude).toStrictEqual(["*.log"]);
    expect(result.include).toStrictEqual(["important.log"]);
  });

  it("should handle empty arrays", () => {
    const result = parsePatterns([], []);

    expect(result.exclude).toStrictEqual([]);
    expect(result.include).toStrictEqual([]);
  });

  it("should normalize backslashes in negation patterns", () => {
    const result = parsePatterns(
      [
        "dist",
        String.raw`!dist\keep`,
        "node_modules",
        String.raw`!node_modules\.cache`,
      ],
      [],
    );

    expect(result.exclude).toStrictEqual(["dist/**", "node_modules/**"]);
    expect(result.include).toStrictEqual(["dist/keep", "node_modules/.cache"]);
  });

  it("should parse explicit include patterns", () => {
    const result = parsePatterns(["node_modules"], [".cache/**", ".vite/**"]);

    expect(result.exclude).toStrictEqual(["node_modules/**"]);
    expect(result.include).toStrictEqual([".cache/**", ".vite/**"]);
  });

  it("should normalize backslashes in explicit include patterns", () => {
    const result = parsePatterns(
      ["dist"],
      [String.raw`dist\keep\**`, String.raw`dist\important.js`],
    );

    expect(result.exclude).toStrictEqual(["dist/**"]);
    expect(result.include).toStrictEqual(["dist/keep/**", "dist/important.js"]);
  });

  it("should expand braces in negation patterns", () => {
    const result = parsePatterns(
      ["node_modules", "!node_modules/{.cache,.vite}/**"],
      [],
    );

    expect(result.exclude).toStrictEqual(["node_modules/**"]);
    expect(result.include).toStrictEqual([
      "node_modules/.cache/**",
      "node_modules/.vite/**",
    ]);
  });

  it("should expand braces in explicit include patterns", () => {
    const result = parsePatterns(
      ["node_modules"],
      ["node_modules/{.cache,.vite}/**"],
    );

    expect(result.exclude).toStrictEqual(["node_modules/**"]);
    expect(result.include).toStrictEqual([
      "node_modules/.cache/**",
      "node_modules/.vite/**",
    ]);
  });

  it("should expand multiple brace patterns", () => {
    const result = parsePatterns(
      [],
      ["src/{components,utils}/{*.test.ts,*.spec.ts}"],
    );

    expect(result.exclude).toStrictEqual([]);
    expect(result.include).toStrictEqual([
      "src/components/*.test.ts",
      "src/components/*.spec.ts",
      "src/utils/*.test.ts",
      "src/utils/*.spec.ts",
    ]);
  });
});
