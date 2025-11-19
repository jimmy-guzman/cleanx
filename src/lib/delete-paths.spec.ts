import { rm } from "node:fs/promises";

import { deletePaths } from "./delete-paths";

vi.mock("node:fs/promises", () => ({
  rm: vi.fn(),
}));

describe("deletePaths", () => {
  const mockRm = vi.mocked(rm);
  const mockOnProgress = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("dry run mode", () => {
    it("should not delete files when isDryRun is true", async () => {
      const paths = ["/path/to/file1", "/path/to/file2"];

      await deletePaths(paths, { isDryRun: true });

      expect(mockRm).not.toHaveBeenCalled();
    });

    it("should call onProgress for each path in dry run", async () => {
      const paths = ["/path/to/file1", "/path/to/file2", "/path/to/file3"];

      await deletePaths(paths, { isDryRun: true, onProgress: mockOnProgress });

      expect(mockOnProgress).toHaveBeenCalledTimes(3);
      expect(mockOnProgress).toHaveBeenNthCalledWith(1, 1, 3, "/path/to/file1");
      expect(mockOnProgress).toHaveBeenNthCalledWith(2, 2, 3, "/path/to/file2");
      expect(mockOnProgress).toHaveBeenNthCalledWith(3, 3, 3, "/path/to/file3");
    });

    it("should not throw error when onProgress is undefined in dry run", async () => {
      const paths = ["/path/to/file1"];

      await expect(
        deletePaths(paths, { isDryRun: true }),
      ).resolves.toBeUndefined();
    });

    it("should handle empty paths array in dry run", async () => {
      await deletePaths([], { isDryRun: true, onProgress: mockOnProgress });

      expect(mockOnProgress).not.toHaveBeenCalled();
      expect(mockRm).not.toHaveBeenCalled();
    });
  });

  describe("actual deletion mode", () => {
    it("should delete all files when isDryRun is false", async () => {
      mockRm.mockResolvedValue(undefined);
      const paths = ["/path/to/file1", "/path/to/file2"];

      await deletePaths(paths, { isDryRun: false });

      expect(mockRm).toHaveBeenCalledTimes(2);
      expect(mockRm).toHaveBeenCalledWith("/path/to/file1", {
        force: true,
        recursive: true,
      });
      expect(mockRm).toHaveBeenCalledWith("/path/to/file2", {
        force: true,
        recursive: true,
      });
    });

    it("should call onProgress after each successful deletion", async () => {
      mockRm.mockResolvedValue(undefined);
      const paths = ["/path/to/file1", "/path/to/file2", "/path/to/file3"];

      await deletePaths(paths, { isDryRun: false, onProgress: mockOnProgress });

      expect(mockOnProgress).toHaveBeenCalledTimes(3);
      expect(mockOnProgress).toHaveBeenNthCalledWith(1, 1, 3, "/path/to/file1");
      expect(mockOnProgress).toHaveBeenNthCalledWith(2, 2, 3, "/path/to/file2");
      expect(mockOnProgress).toHaveBeenNthCalledWith(3, 3, 3, "/path/to/file3");
    });

    it("should not throw error when onProgress is undefined", async () => {
      mockRm.mockResolvedValue(undefined);
      const paths = ["/path/to/file1"];

      await expect(
        deletePaths(paths, { isDryRun: false }),
      ).resolves.toBeUndefined();
    });

    it("should handle empty paths array", async () => {
      await deletePaths([], { isDryRun: false, onProgress: mockOnProgress });

      expect(mockOnProgress).not.toHaveBeenCalled();
      expect(mockRm).not.toHaveBeenCalled();
    });

    it("should delete single path", async () => {
      mockRm.mockResolvedValue(undefined);
      const paths = ["/path/to/file1"];

      await deletePaths(paths, { isDryRun: false, onProgress: mockOnProgress });

      expect(mockRm).toHaveBeenCalledOnce();
      expect(mockOnProgress).toHaveBeenCalledWith(1, 1, "/path/to/file1");
    });
  });

  describe("error handling", () => {
    it("should throw error with path and message when deletion fails", async () => {
      const errorMessage = "Permission denied";

      mockRm.mockRejectedValue(new Error(errorMessage));
      const paths = ["/path/to/file1"];

      await expect(deletePaths(paths, { isDryRun: false })).rejects.toThrow(
        `Failed to delete /path/to/file1: ${errorMessage}`,
      );
    });

    it("should include original error as cause", async () => {
      const originalError = new Error("Permission denied");

      mockRm.mockRejectedValue(originalError);
      const paths = ["/path/to/file1"];

      try {
        await deletePaths(paths, { isDryRun: false });

        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).cause).toBe(originalError);
      }
    });

    it("should handle non-Error objects thrown from rm", async () => {
      mockRm.mockRejectedValue("string error");
      const paths = ["/path/to/file1"];

      await expect(deletePaths(paths, { isDryRun: false })).rejects.toThrow(
        "Failed to delete /path/to/file1: string error",
      );
    });

    it("should handle undefined error from rm", async () => {
      mockRm.mockRejectedValue(undefined);
      const paths = ["/path/to/file1"];

      await expect(deletePaths(paths, { isDryRun: false })).rejects.toThrow(
        "Failed to delete /path/to/file1: undefined",
      );
    });

    it("should handle null error from rm", async () => {
      mockRm.mockRejectedValue(null);
      const paths = ["/path/to/file1"];

      await expect(deletePaths(paths, { isDryRun: false })).rejects.toThrow(
        "Failed to delete /path/to/file1: null",
      );
    });

    it("should not call onProgress when deletion fails", async () => {
      mockRm.mockRejectedValue(new Error("Failed"));
      const paths = ["/path/to/file1"];

      await expect(
        deletePaths(paths, { isDryRun: false, onProgress: mockOnProgress }),
      ).rejects.toThrow("Failed to delete /path/to/file1: Failed");

      expect(mockOnProgress).not.toHaveBeenCalled();
    });

    it("should throw error for specific failed path when multiple paths exist", async () => {
      mockRm
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Permission denied"))
        .mockResolvedValueOnce(undefined);

      const paths = ["/path/to/file1", "/path/to/file2", "/path/to/file3"];

      await expect(deletePaths(paths, { isDryRun: false })).rejects.toThrow(
        "Failed to delete /path/to/file2: Permission denied",
      );
    });
  });

  describe("concurrent operations", () => {
    it("should delete all paths concurrently using Promise.all", async () => {
      const delayMs = 100;
      let callCount = 0;

      mockRm.mockImplementation(async () => {
        callCount++;
        await new Promise((resolve) => {
          setTimeout(resolve, delayMs);
        });
      });

      const paths = ["/path/to/file1", "/path/to/file2", "/path/to/file3"];
      const startTime = Date.now();

      await deletePaths(paths, { isDryRun: false });

      const elapsed = Date.now() - startTime;

      // If running concurrently, should take ~delayMs
      // If running sequentially, would take ~3*delayMs
      expect(elapsed).toBeLessThan(delayMs * 2);
      expect(callCount).toBe(3);
    });

    it("should handle mixed success and failure in concurrent deletions", async () => {
      mockRm
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce(undefined);

      const paths = ["/path/to/file1", "/path/to/file2", "/path/to/file3"];

      await expect(
        deletePaths(paths, { isDryRun: false, onProgress: mockOnProgress }),
      ).rejects.toThrow("Failed to delete /path/to/file2: Failed");

      // Progress should be called for successful deletions
      expect(mockRm).toHaveBeenCalledTimes(3);
    });
  });

  describe("rm options", () => {
    it("should always use force: true option", async () => {
      mockRm.mockResolvedValue(undefined);
      const paths = ["/path/to/file1"];

      await deletePaths(paths, { isDryRun: false });

      expect(mockRm).toHaveBeenCalledWith("/path/to/file1", {
        force: true,
        recursive: true,
      });
    });

    it("should always use recursive: true option", async () => {
      mockRm.mockResolvedValue(undefined);
      const paths = ["/path/to/directory"];

      await deletePaths(paths, { isDryRun: false });

      expect(mockRm).toHaveBeenCalledWith("/path/to/directory", {
        force: true,
        recursive: true,
      });
    });
  });

  describe("progress tracking", () => {
    it("should increment progress counter correctly", async () => {
      mockRm.mockResolvedValue(undefined);
      const paths = ["/path/1", "/path/2", "/path/3", "/path/4", "/path/5"];

      await deletePaths(paths, { isDryRun: false, onProgress: mockOnProgress });

      expect(mockOnProgress).toHaveBeenCalledTimes(5);

      for (const [index, call] of mockOnProgress.mock.calls.entries()) {
        expect(call[0]).toBe(index + 1); // current
        expect(call[1]).toBe(5); // total
      }
    });

    it("should track progress correctly in dry run mode", async () => {
      const paths = ["/path/1", "/path/2", "/path/3"];

      await deletePaths(paths, { isDryRun: true, onProgress: mockOnProgress });

      expect(mockOnProgress).toHaveBeenCalledTimes(3);
      expect(mockOnProgress).toHaveBeenNthCalledWith(1, 1, 3, "/path/1");
      expect(mockOnProgress).toHaveBeenNthCalledWith(2, 2, 3, "/path/2");
      expect(mockOnProgress).toHaveBeenNthCalledWith(3, 3, 3, "/path/3");
    });
  });
});
