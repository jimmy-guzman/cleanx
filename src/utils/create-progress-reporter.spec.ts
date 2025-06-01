import { blue, gray } from "ansis";

import { PERCENTAGE_MULTIPLIER } from "../constants";
import { createProgressReporter } from "./create-progress-reporter";
import { logger } from "./logger";

// Mock the logger
vi.mock("./logger", () => {
  return {
    logger: {
      info: vi.fn(),
    },
  };
});

// Mock ansis colors to return predictable strings for testing
vi.mock("ansis", () => {
  return {
    blue: vi.fn((text: string) => {
      return `[BLUE]${text}[/BLUE]`;
    }),
    gray: vi.fn((text: string) => {
      return `[GRAY]${text}[/GRAY]`;
    }),
  };
});

describe("createProgressReporter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic functionality", () => {
    it("should return a function", () => {
      const reporter = createProgressReporter("/test/dir");

      expect(typeof reporter).toBe("function");
    });

    it("should not log initial progress at 0% (waits for meaningful progress)", () => {
      const reporter = createProgressReporter("/test/dir");

      reporter(0, 100);

      expect(logger.info).not.toHaveBeenCalled();
    });

    it("should log completion when deleted equals total", () => {
      const reporter = createProgressReporter("/test/dir");

      reporter(100, 100);

      expect(logger.info).toHaveBeenCalledWith(
        "Cleaning [BLUE]/test/dir[/BLUE] [GRAY]100/100 paths (100%)[/GRAY]",
      );
    });
  });

  describe("progress interval logic", () => {
    it("should only log when progress exceeds the interval threshold", () => {
      const reporter = createProgressReporter("/test/dir");

      // With PROGRESS_LOG_INTERVAL = 20, logging should start at 20%
      reporter(0, 100); // 0% - shouldn't log
      expect(logger.info).toHaveBeenCalledTimes(0);

      reporter(19, 100); // 19% - shouldn't log
      expect(logger.info).toHaveBeenCalledTimes(0);

      reporter(20, 100); // 20% - should log
      expect(logger.info).toHaveBeenCalledTimes(1);

      expect(logger.info).toHaveBeenLastCalledWith(
        "Cleaning [BLUE]/test/dir[/BLUE] [GRAY]20/100 paths (20%)[/GRAY]",
      );
    });

    it("should handle edge case where total is very small", () => {
      const reporter = createProgressReporter("/small/dir");

      reporter(1, 2); // 50%
      reporter(2, 2); // 100% (completion)

      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        "Cleaning [BLUE]/small/dir[/BLUE] [GRAY]1/2 paths (50%)[/GRAY]",
      );
      expect(logger.info).toHaveBeenNthCalledWith(
        2,
        "Cleaning [BLUE]/small/dir[/BLUE] [GRAY]2/2 paths (100%)[/GRAY]",
      );
    });
  });

  describe("percentage calculations", () => {
    it("should calculate percentages correctly using PERCENTAGE_MULTIPLIER", () => {
      const reporter = createProgressReporter("/test/dir");

      reporter(25, 100);

      expect(logger.info).toHaveBeenCalledWith(
        "Cleaning [BLUE]/test/dir[/BLUE] [GRAY]25/100 paths (25%)[/GRAY]",
      );
    });

    it("should handle decimal percentages by flooring", () => {
      const reporter = createProgressReporter("/test/dir");

      reporter(1, 3);

      const expectedPercent = Math.floor((1 / 3) * PERCENTAGE_MULTIPLIER);

      expect(logger.info).toHaveBeenCalledWith(
        `Cleaning [BLUE]/test/dir[/BLUE] [GRAY]1/3 paths (${expectedPercent}%)[/GRAY]`,
      );
    });
  });

  describe("state management", () => {
    it("should maintain separate state for different reporter instances", () => {
      const reporter1 = createProgressReporter("/dir1");
      const reporter2 = createProgressReporter("/dir2");

      reporter1(100, 100);
      reporter2(100, 100);

      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        "Cleaning [BLUE]/dir1[/BLUE] [GRAY]100/100 paths (100%)[/GRAY]",
      );
      expect(logger.info).toHaveBeenNthCalledWith(
        2,
        "Cleaning [BLUE]/dir2[/BLUE] [GRAY]100/100 paths (100%)[/GRAY]",
      );
    });

    it("should remember last logged percentage across calls", () => {
      const reporter = createProgressReporter("/test/dir");

      reporter(20, 100);
      expect(logger.info).toHaveBeenCalledTimes(1);

      reporter(40, 100);
      expect(logger.info).toHaveBeenCalledTimes(2);
    });
  });

  describe("edge cases", () => {
    it("should handle zero total gracefully", () => {
      const reporter = createProgressReporter("/empty/dir");

      reporter(0, 0);

      expect(logger.info).toHaveBeenCalledWith(
        "Cleaning [BLUE]/empty/dir[/BLUE] [GRAY]0/0 paths (NaN%)[/GRAY]",
      );
    });

    it("should handle completion from any starting point", () => {
      const reporter = createProgressReporter("/test/dir");

      reporter(50, 100);
      expect(logger.info).toHaveBeenCalledTimes(1);

      reporter(100, 100);
      expect(logger.info).toHaveBeenCalledTimes(2);
      expect(logger.info).toHaveBeenLastCalledWith(
        "Cleaning [BLUE]/test/dir[/BLUE] [GRAY]100/100 paths (100%)[/GRAY]",
      );
    });

    it("should handle large numbers", () => {
      const reporter = createProgressReporter("/large/dir");

      reporter(500_000, 1_000_000);

      expect(logger.info).toHaveBeenCalledWith(
        "Cleaning [BLUE]/large/dir[/BLUE] [GRAY]500000/1000000 paths (50%)[/GRAY]",
      );
    });
  });

  describe("directory path handling", () => {
    it("should handle various directory path formats", () => {
      const testCases = [
        "/absolute/path",
        "./relative/path",
        "../parent/path",
        "simple-dir",
        "/path/with spaces/dir",
        "/path/with-special_chars.123/dir",
      ];

      for (const dir of testCases) {
        const reporter = createProgressReporter(dir);

        reporter(100, 100);

        expect(logger.info).toHaveBeenCalledWith(
          `Cleaning [BLUE]${dir}[/BLUE] [GRAY]100/100 paths (100%)[/GRAY]`,
        );
      }
    });
  });

  describe("integration with ansis colors", () => {
    it("should call blue and gray color functions correctly", () => {
      const reporter = createProgressReporter("/colorful/dir");

      reporter(25, 100);

      expect(blue).toHaveBeenCalledWith("/colorful/dir");
      expect(gray).toHaveBeenCalledWith("25/100 paths (25%)");
    });
  });
});
