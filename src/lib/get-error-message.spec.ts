import { getErrorMessage } from "./get-error-message";

describe("getErrorMessage", () => {
  it("should return message from Error instances", () => {
    expect(getErrorMessage(new Error("test error"))).toBe("test error");
  });

  it("should return string representation of non-Error values", () => {
    expect(getErrorMessage("string error")).toBe("string error");
    expect(getErrorMessage(42)).toBe("42");
    expect(getErrorMessage(null)).toBe("null");
    expect(getErrorMessage(undefined)).toBe("undefined");
    expect(getErrorMessage(true)).toBe("true");
  });

  it("should handle Error subclasses", () => {
    expect(getErrorMessage(new TypeError("type error"))).toBe("type error");
    expect(getErrorMessage(new RangeError("range error"))).toBe("range error");
  });

  it("should handle empty Error message", () => {
    // eslint-disable-next-line unicorn/error-message -- testing empty message behavior
    expect(getErrorMessage(new Error(""))).toBe("");
  });
});
