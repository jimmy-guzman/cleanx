import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it("should format milliseconds", () => {
    expect(formatDuration(0)).toBe("0ms");
    expect(formatDuration(1)).toBe("1ms");
    expect(formatDuration(500)).toBe("500ms");
    expect(formatDuration(999)).toBe("999ms");
  });

  it("should round milliseconds", () => {
    expect(formatDuration(1.4)).toBe("1ms");
    expect(formatDuration(1.5)).toBe("2ms");
    expect(formatDuration(999.9)).toBe("1000ms");
  });

  it("should format seconds with one decimal", () => {
    expect(formatDuration(1000)).toBe("1.0s");
    expect(formatDuration(1500)).toBe("1.5s");
    expect(formatDuration(2345)).toBe("2.3s");
    expect(formatDuration(59_999)).toBe("60.0s");
  });

  it("should format minutes", () => {
    expect(formatDuration(60_000)).toBe("1m");
    expect(formatDuration(120_000)).toBe("2m");
    expect(formatDuration(3_599_999)).toBe("60m");
  });

  it("should format hours", () => {
    expect(formatDuration(3_600_000)).toBe("1h");
    expect(formatDuration(7_200_000)).toBe("2h");
  });
});
