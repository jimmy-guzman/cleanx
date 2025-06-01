import { plural } from "./plural";

describe("plural", () => {
  it("should return singular form with count 1", () => {
    const result = plural(1, "apple");

    expect(result).toBe("apple");
  });

  it("should return plural form with count 0", () => {
    const result = plural(0, "apple");

    expect(result).toBe("apples");
  });

  it("should return plural form with count greater than 1", () => {
    const result = plural(5, "apple");

    expect(result).toBe("apples");
  });

  it("should use custom plural form when provided", () => {
    const result = plural(2, "child", "children");

    expect(result).toBe("children");
  });

  it("should use custom plural form with count 0", () => {
    const result = plural(0, "child", "children");

    expect(result).toBe("children");
  });

  it("should use singular form with count 1 even when custom plural provided", () => {
    const result = plural(1, "child", "children");

    expect(result).toBe("child");
  });

  it("should handle negative counts as plural", () => {
    const result = plural(-1, "item");

    expect(result).toBe("items");
  });

  it("should handle decimal counts as plural", () => {
    const result = plural(1.5, "meter");

    expect(result).toBe("meters");
  });

  it("should handle large numbers", () => {
    const result = plural(1_000_000, "record");

    expect(result).toBe("records");
  });

  it("should work with words ending in 's'", () => {
    const result = plural(3, "class");

    // cspell:disable-next-line
    expect(result).toBe("classs");
  });

  it("should work with custom plural for words ending in 's'", () => {
    const result = plural(3, "class", "classes");

    expect(result).toBe("classes");
  });

  it("should handle empty string singular", () => {
    const result = plural(2, "");

    expect(result).toBe("s");
  });

  it("should handle realistic workspace example", () => {
    const result = plural(1, "workspace");

    expect(result).toBe("workspace");
  });

  it("should handle realistic workspaces example", () => {
    const result = plural(3, "workspace");

    expect(result).toBe("workspaces");
  });
});
