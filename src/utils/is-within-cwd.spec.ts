import { isWithinCwd } from "./is-within-cwd";

describe("isWithinCwd", () => {
  describe("should return true for valid paths within cwd", () => {
    it("should return true for simple directory names", () => {
      expect(isWithinCwd("packages")).toBe(true);
      expect(isWithinCwd("apps")).toBe(true);
      expect(isWithinCwd("libs")).toBe(true);
      expect(isWithinCwd("src")).toBe(true);
    });

    it("should return true for nested directory paths", () => {
      expect(isWithinCwd("packages/app")).toBe(true);
      expect(isWithinCwd("packages/lib/utils")).toBe(true);
      expect(isWithinCwd("apps/frontend/src")).toBe(true);
      expect(isWithinCwd("libs/shared/components")).toBe(true);
    });

    it("should return true for deeply nested paths", () => {
      expect(isWithinCwd("very/deeply/nested/directory/structure")).toBe(true);
      expect(isWithinCwd("a/b/c/d/e/f/g")).toBe(true);
    });

    it("should return true for paths with special characters", () => {
      expect(isWithinCwd("my-package")).toBe(true);
      expect(isWithinCwd("package_name")).toBe(true);
      expect(isWithinCwd("@scope/package")).toBe(true);
      expect(isWithinCwd("packages/@my-org/utils")).toBe(true);
    });

    it("should return true for paths with numbers", () => {
      expect(isWithinCwd("v1")).toBe(true);
      expect(isWithinCwd("packages/app-v2")).toBe(true);
      expect(isWithinCwd("2023/projects")).toBe(true);
    });
  });

  describe("should return false for invalid paths", () => {
    it("should return false for empty string", () => {
      expect(isWithinCwd("")).toBe(false);
    });

    it("should return false for current directory", () => {
      expect(isWithinCwd(".")).toBe(false);
    });

    it("should return false for parent directory references", () => {
      expect(isWithinCwd("..")).toBe(false);
      expect(isWithinCwd("../")).toBe(false);
      expect(isWithinCwd("../parent")).toBe(false);
      expect(isWithinCwd("../../../grandparent")).toBe(false);
    });

    it("should return false for paths that start with parent directory", () => {
      expect(isWithinCwd("../sibling")).toBe(false);
      expect(isWithinCwd("../sibling/nested")).toBe(false);
      expect(isWithinCwd("../../other")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle paths that contain .. but don't start with it", () => {
      // Note: These are still valid relative paths within cwd
      // The function only checks if it STARTS with ".."
      expect(isWithinCwd("packages/..invalid")).toBe(true);
      expect(isWithinCwd("src/..hidden")).toBe(true);
      expect(isWithinCwd("my..package")).toBe(true);
    });

    it("should handle paths with dots that are not parent references", () => {
      expect(isWithinCwd(".git")).toBe(true);
      expect(isWithinCwd(".github")).toBe(true);
      expect(isWithinCwd(".vscode")).toBe(true);
      expect(isWithinCwd("packages/.hidden")).toBe(true);
    });

    it("should handle Windows-style paths", () => {
      expect(isWithinCwd(String.raw`packages\app`)).toBe(true);
      expect(isWithinCwd(String.raw`src\components\Button`)).toBe(true);
    });

    it("should handle mixed path separators", () => {
      expect(isWithinCwd(String.raw`packages/app\src`)).toBe(true);
      expect(isWithinCwd(String.raw`apps\frontend/components`)).toBe(true);
    });

    it("should handle paths with trailing separators", () => {
      expect(isWithinCwd("packages/")).toBe(true);
      expect(isWithinCwd("apps\\")).toBe(true);
    });

    it("should be case sensitive", () => {
      expect(isWithinCwd("Packages")).toBe(true);
      expect(isWithinCwd("APPS")).toBe(true);
      expect(isWithinCwd("CamelCase")).toBe(true);
    });
  });

  describe("common monorepo patterns", () => {
    it("should return true for typical monorepo workspace paths", () => {
      expect(isWithinCwd("packages/ui")).toBe(true);
      expect(isWithinCwd("packages/utils")).toBe(true);
      expect(isWithinCwd("apps/web")).toBe(true);
      expect(isWithinCwd("apps/mobile")).toBe(true);
      expect(isWithinCwd("libs/shared")).toBe(true);
      expect(isWithinCwd("services/api")).toBe(true);
      expect(isWithinCwd("tools/build")).toBe(true);
    });

    it("should return true for nested monorepo structures", () => {
      expect(isWithinCwd("packages/ui/components")).toBe(true);
      expect(isWithinCwd("packages/ui/icons")).toBe(true);
      expect(isWithinCwd("libs/shared/utils")).toBe(true);
      expect(isWithinCwd("apps/web/frontend")).toBe(true);
    });

    it("should return true for scoped package names", () => {
      expect(isWithinCwd("packages/@company/ui")).toBe(true);
      expect(isWithinCwd("packages/@scope/utils")).toBe(true);
      expect(isWithinCwd("libs/@internal/shared")).toBe(true);
    });
  });
});
