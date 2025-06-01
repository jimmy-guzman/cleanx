import { dedupe } from "./dedupe";

describe("dedupe", () => {
  it("should remove duplicate strings", () => {
    const input = ["a", "b", "a", "c", "b"];
    const result = dedupe(input);

    expect(result).toStrictEqual(["a", "b", "c"]);
  });

  it("should preserve order of first occurrence", () => {
    const input = ["first", "second", "first", "third", "second"];
    const result = dedupe(input);

    expect(result).toStrictEqual(["first", "second", "third"]);
  });

  it("should return empty array for empty input", () => {
    const result = dedupe([]);

    expect(result).toStrictEqual([]);
  });

  it("should use default parameter when no argument provided", () => {
    const result = dedupe();

    expect(result).toStrictEqual([]);
  });

  it("should handle array with no duplicates", () => {
    const input = ["unique", "items", "only"];
    const result = dedupe(input);

    expect(result).toStrictEqual(["unique", "items", "only"]);
  });

  it("should handle array with all duplicates", () => {
    const input = ["same", "same", "same"];
    const result = dedupe(input);

    expect(result).toStrictEqual(["same"]);
  });

  it("should handle single item array", () => {
    const input = ["single"];
    const result = dedupe(input);

    expect(result).toStrictEqual(["single"]);
  });

  it("should not mutate original array", () => {
    const input = ["a", "b", "a"];
    const originalInput = [...input];

    dedupe(input);

    expect(input).toStrictEqual(originalInput);
  });
});
