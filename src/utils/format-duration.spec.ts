import { describe, expect, it } from "vitest";

import { formatDuration } from "./format-duration";

describe("formatDuration", () => {
  describe("milliseconds", () => {
    it("should format milliseconds under 1 second", () => {
      expect(formatDuration(0)).toBe("0ms");
      expect(formatDuration(1)).toBe("1ms");
      expect(formatDuration(500)).toBe("500ms");
      expect(formatDuration(999)).toBe("999ms");
    });

    it("should round fractional milliseconds", () => {
      expect(formatDuration(0.4)).toBe("0ms");
      expect(formatDuration(0.5)).toBe("1ms");
      expect(formatDuration(999.4)).toBe("999ms");
      expect(formatDuration(999.5)).toBe("1000ms");
    });
  });

  describe("seconds", () => {
    it("should format seconds with one decimal place", () => {
      expect(formatDuration(1000)).toBe("1.0 second");
      expect(formatDuration(1500)).toBe("1.5 seconds"); // 1.5 is plural
      expect(formatDuration(2000)).toBe("2.0 seconds");
      expect(formatDuration(59_999)).toBe("60.0 seconds");
    });

    it("should handle singular vs plural correctly", () => {
      expect(formatDuration(1000)).toBe("1.0 second");
      expect(formatDuration(1001)).toBe("1.0 second");
      expect(formatDuration(1999)).toBe("2.0 seconds"); // rounds to 2.0, so plural
      expect(formatDuration(2000)).toBe("2.0 seconds");
    });

    it("should format fractional seconds", () => {
      expect(formatDuration(1234)).toBe("1.2 seconds"); // 1.2 is plural
      expect(formatDuration(1567)).toBe("1.6 seconds"); // 1.6 is plural
      expect(formatDuration(45_678)).toBe("45.7 seconds");
    });
  });

  describe("minutes only", () => {
    it("should format whole minutes without seconds", () => {
      expect(formatDuration(60_000)).toBe("1 minute");
      expect(formatDuration(120_000)).toBe("2 minutes");
      expect(formatDuration(600_000)).toBe("10 minutes");
    });

    it("should handle singular vs plural correctly", () => {
      expect(formatDuration(60_000)).toBe("1 minute");
      expect(formatDuration(120_000)).toBe("2 minutes");
    });
  });

  describe("minutes and seconds", () => {
    it("should format minutes and seconds in short form", () => {
      expect(formatDuration(61_000)).toBe("1m 1s");
      expect(formatDuration(62_000)).toBe("1m 2s");
      expect(formatDuration(125_000)).toBe("2m 5s");
      expect(formatDuration(3_661_000)).toBe("61m 1s");
    });

    it("should round seconds to nearest whole number", () => {
      expect(formatDuration(61_400)).toBe("1m 1s");
      expect(formatDuration(61_500)).toBe("1m 2s");
      expect(formatDuration(61_600)).toBe("1m 2s");
    });

    it("should handle edge cases with rounding", () => {
      expect(formatDuration(119_500)).toBe("2 minutes"); // 119.5s rounds to 120s = 2 minutes exactly
      expect(formatDuration(179_500)).toBe("3 minutes"); // 179.5s rounds to 180s = 3 minutes exactly
    });
  });

  describe("edge cases", () => {
    it("should handle exactly 1 second", () => {
      expect(formatDuration(1000)).toBe("1.0 second");
    });

    it("should handle exactly 1 minute", () => {
      expect(formatDuration(60_000)).toBe("1 minute");
    });

    it("should handle large durations", () => {
      expect(formatDuration(3_661_000)).toBe("61m 1s");
      expect(formatDuration(36_000_000)).toBe("600 minutes"); // Exactly 600 minutes, no remainder
    });

    it("should handle very small positive values", () => {
      expect(formatDuration(0.1)).toBe("0ms");
      expect(formatDuration(0.9)).toBe("1ms");
    });
  });
});
