import { getWorkspacePaths } from "./get-workspace-paths";

describe("getWorkspacePaths", () => {
  it("should return empty array when packages is empty and no rootPackage", () => {
    const result = getWorkspacePaths({ packages: [] });

    expect(result).toStrictEqual([]);
  });

  it("should return only rootPackage dir when packages is empty", () => {
    const result = getWorkspacePaths({
      packages: [],
      rootPackage: { dir: "/root" },
    });

    expect(result).toStrictEqual(["/root"]);
  });

  it("should return package dirs when rootPackage is not provided", () => {
    const result = getWorkspacePaths({
      packages: [{ dir: "/pkg1" }, { dir: "/pkg2" }],
    });

    expect(result).toStrictEqual(["/pkg1", "/pkg2"]);
  });

  it("should combine rootPackage and packages dirs", () => {
    const result = getWorkspacePaths({
      packages: [{ dir: "/pkg1" }, { dir: "/pkg2" }],
      rootPackage: { dir: "/root" },
    });

    expect(result).toStrictEqual(["/root", "/pkg1", "/pkg2"]);
  });

  it("should remove duplicate paths", () => {
    const result = getWorkspacePaths({
      packages: [{ dir: "/pkg1" }, { dir: "/pkg1" }, { dir: "/pkg2" }],
      rootPackage: { dir: "/pkg1" },
    });

    expect(result).toStrictEqual(["/pkg1", "/pkg2"]);
  });

  it("should filter out packages without dir property", () => {
    const result = getWorkspacePaths({
      packages: [{ dir: "/pkg1" }, {}, { dir: "/pkg2" }],
    });

    expect(result).toStrictEqual(["/pkg1", "/pkg2"]);
  });

  it("should filter out packages with undefined dir", () => {
    const result = getWorkspacePaths({
      packages: [{ dir: "/pkg1" }, { dir: undefined }, { dir: "/pkg2" }],
    });

    expect(result).toStrictEqual(["/pkg1", "/pkg2"]);
  });

  it("should filter out rootPackage when dir is undefined", () => {
    const result = getWorkspacePaths({
      packages: [{ dir: "/pkg1" }],
      rootPackage: { dir: undefined },
    });

    expect(result).toStrictEqual(["/pkg1"]);
  });

  it("should handle rootPackage without dir property", () => {
    const result = getWorkspacePaths({
      packages: [{ dir: "/pkg1" }],
      rootPackage: {},
    });

    expect(result).toStrictEqual(["/pkg1"]);
  });

  it("should handle empty string dirs", () => {
    const result = getWorkspacePaths({
      packages: [{ dir: "" }, { dir: "/pkg1" }],
      rootPackage: { dir: "" },
    });

    expect(result).toStrictEqual(["/pkg1"]);
  });

  it("should preserve order with duplicates removed (keeps first occurrence)", () => {
    const result = getWorkspacePaths({
      packages: [{ dir: "/pkg1" }, { dir: "/pkg2" }, { dir: "/pkg1" }],
    });

    expect(result).toStrictEqual(["/pkg1", "/pkg2"]);
  });

  it("should handle complex path strings", () => {
    const result = getWorkspacePaths({
      packages: [
        { dir: "/path/to/package-1" },
        { dir: "./relative/path" },
        { dir: "../parent/path" },
      ],
      rootPackage: { dir: "/workspace/root" },
    });

    expect(result).toStrictEqual([
      "/workspace/root",
      "/path/to/package-1",
      "./relative/path",
      "../parent/path",
    ]);
  });

  it("should handle all packages without dir", () => {
    const result = getWorkspacePaths({
      packages: [{}, {}, {}],
    });

    expect(result).toStrictEqual([]);
  });

  it("should maintain type safety with optional properties", () => {
    const result = getWorkspacePaths({
      packages: [{ dir: "/pkg1" }, { dir: "/pkg2" }],
      rootPackage: { dir: "/root" },
    });

    expect(Array.isArray(result)).toBe(true);

    for (const path of result) {
      expectTypeOf(path).toBeString();
    }
  });
});
