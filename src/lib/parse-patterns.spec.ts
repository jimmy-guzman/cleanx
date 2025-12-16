import { parsePatterns } from "./parse-patterns";

describe("parsePatterns", () => {
  it("should preserve patterns that already contain **", async () => {
    const result = await parsePatterns(
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

  it("should add ** to directory patterns ending with /", async () => {
    const result = await parsePatterns(
      ["dist/", "node_modules/", "build/"],
      [],
    );

    expect(result.exclude).toStrictEqual([
      "dist/**",
      "node_modules/**",
      "build/**",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should add /** to plain directory names", async () => {
    const result = await parsePatterns(["dist", "node_modules", "build"], []);

    expect(result.exclude).toStrictEqual([
      "dist/**",
      "node_modules/**",
      "build/**",
    ]);
    expect(result.include).toStrictEqual([]);
  });

  it("should handle nested directory paths", async () => {
    const result = await parsePatterns(
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

  it("should preserve file glob patterns with asterisk", async () => {
    const result = await parsePatterns(["*.log", "*.js", "test-*.json"], []);

    expect(result.exclude).toStrictEqual(["*.log", "*.js", "test-*.json"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve file patterns with extensions", async () => {
    const result = await parsePatterns(
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

  it("should preserve question mark glob patterns", async () => {
    const result = await parsePatterns(["file?.txt", "test?.log"], []);

    expect(result.exclude).toStrictEqual(["file?.txt", "test?.log"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve bracket glob patterns", async () => {
    const result = await parsePatterns(["file[0-9].txt", "[abc].log"], []);

    expect(result.exclude).toStrictEqual(["file[0-9].txt", "[abc].log"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve nested file patterns", async () => {
    const result = await parsePatterns(["src/*.js", "logs/*.log"], []);

    expect(result.exclude).toStrictEqual(["src/*.js", "logs/*.log"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should preserve exact filenames with extensions", async () => {
    const result = await parsePatterns(
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

  it("should preserve dotfiles", async () => {
    const result = await parsePatterns([".env", ".npmrc", ".eslintrc"], []);

    expect(result.exclude).toStrictEqual([".env", ".npmrc", ".eslintrc"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should normalize Windows backslashes to forward slashes", async () => {
    const result = await parsePatterns(
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

  it("should handle root path", async () => {
    const result = await parsePatterns(["/"], []);

    expect(result.exclude).toStrictEqual(["/**"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should convert negation patterns to include", async () => {
    const result = await parsePatterns(["!.env.example", "!dist/keep.js"], []);

    expect(result.exclude).toStrictEqual([]);
    expect(result.include).toStrictEqual([".env.example", "dist/keep.js"]);
  });

  it("should handle mix of regular and negation patterns", async () => {
    const result = await parsePatterns(
      [".env*", "!.env.example", "node_modules", "!node_modules/.cache/**"],
      [],
    );

    expect(result.exclude).toStrictEqual([".env*", "node_modules/**"]);
    expect(result.include).toStrictEqual([
      ".env.example",
      "node_modules/.cache/**",
    ]);
  });

  it("should not normalize include patterns from negations", async () => {
    const result = await parsePatterns(["dist", "!dist/keep"], []);

    expect(result.exclude).toStrictEqual(["dist/**"]);
    expect(result.include).toStrictEqual(["dist/keep"]);
  });

  it("should preserve file patterns in negations", async () => {
    const result = await parsePatterns(["*.log", "!important.log"], []);

    expect(result.exclude).toStrictEqual(["*.log"]);
    expect(result.include).toStrictEqual(["important.log"]);
  });

  it("should handle empty arrays", async () => {
    const result = await parsePatterns([], []);

    expect(result.exclude).toStrictEqual([]);
    expect(result.include).toStrictEqual([]);
  });

  it("should normalize backslashes in negation patterns", async () => {
    const result = await parsePatterns(
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

  it("should parse explicit include patterns", async () => {
    const result = await parsePatterns(
      ["node_modules"],
      [".cache/**", ".vite/**"],
    );

    expect(result.exclude).toStrictEqual(["node_modules/**"]);
    expect(result.include).toStrictEqual([".cache/**", ".vite/**"]);
  });

  it("should normalize backslashes in explicit include patterns", async () => {
    const result = await parsePatterns(
      ["dist"],
      [String.raw`dist\keep\**`, String.raw`dist\important.js`],
    );

    expect(result.exclude).toStrictEqual(["dist/**"]);
    expect(result.include).toStrictEqual(["dist/keep/**", "dist/important.js"]);
  });

  it("should expand braces in negation patterns", async () => {
    const result = await parsePatterns(
      ["node_modules", "!node_modules/{.cache,.vite}/**"],
      [],
    );

    expect(result.exclude).toStrictEqual(["node_modules/**"]);
    expect(result.include).toStrictEqual([
      "node_modules/.cache/**",
      "node_modules/.vite/**",
    ]);
  });

  it("should expand braces in explicit include patterns", async () => {
    const result = await parsePatterns(
      ["node_modules"],
      ["node_modules/{.cache,.vite}/**"],
    );

    expect(result.exclude).toStrictEqual(["node_modules/**"]);
    expect(result.include).toStrictEqual([
      "node_modules/.cache/**",
      "node_modules/.vite/**",
    ]);
  });

  it("should expand multiple brace patterns", async () => {
    const result = await parsePatterns(
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

  it("should expand braces in exclude patterns", async () => {
    const result = await parsePatterns(["dist/{foo,bar}"], []);

    expect(result.exclude).toStrictEqual(["dist/foo/**", "dist/bar/**"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should expand braces with file patterns in exclude", async () => {
    const result = await parsePatterns(["*.{log,tmp}"], []);

    expect(result.exclude).toStrictEqual(["*.log", "*.tmp"]);
    expect(result.include).toStrictEqual([]);
  });

  it("should expand braces in nested paths in exclude", async () => {
    const result = await parsePatterns(["src/{components,utils}/dist"], []);

    expect(result.exclude).toStrictEqual([
      "src/components/dist/**",
      "src/utils/dist/**",
    ]);
    expect(result.include).toStrictEqual([]);
  });
});
