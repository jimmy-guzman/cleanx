import { join } from "node:path";

import type { Package, Tool } from "@manypkg/get-packages";

import { getPackages } from "@manypkg/get-packages";

import { inferWorkspaces } from "./infer-workspaces";

vi.mock("@manypkg/get-packages");

const mockGetPackages = vi.mocked(getPackages);

describe("inferWorkspaces", () => {
  const mockCwd = "/repo";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty object when getPackages throws", async () => {
    mockGetPackages.mockRejectedValue(new Error("No packages found"));

    const result = await inferWorkspaces(mockCwd);

    expect(result).toStrictEqual({});
    expect(mockGetPackages).toHaveBeenCalledWith(mockCwd);
  });

  it("should return empty object when no packages found", async () => {
    mockGetPackages.mockResolvedValue({
      packages: [],
      rootDir: mockCwd,
      rootPackage: undefined,
      tool: {} as Tool,
    });

    const result = await inferWorkspaces(mockCwd);

    expect(result).toStrictEqual({});
  });

  it("should include packages that are within cwd", async () => {
    const mockPackages = [
      {
        dir: join(mockCwd, "packages/app-a"),
        packageJson: { name: "app-a" },
      },
      {
        dir: join(mockCwd, "packages/app-b"),
        packageJson: { name: "app-b" },
      },
    ] as Package[];

    mockGetPackages.mockResolvedValue({
      packages: mockPackages,
      rootDir: mockCwd,
      rootPackage: undefined,
      tool: {} as Tool,
    });

    const result = await inferWorkspaces(mockCwd);

    expect(result).toStrictEqual({
      "/repo/packages/app-a": {},
      "/repo/packages/app-b": {},
    });
  });

  it("should exclude root package (current directory)", async () => {
    const mockPackages = [
      { dir: mockCwd, packageJson: { name: "root" } },
      {
        dir: join(mockCwd, "packages/app-a"),
        packageJson: { name: "app-a" },
      },
    ] as Package[];

    mockGetPackages.mockResolvedValue({
      packages: mockPackages,
      rootDir: mockCwd,
      rootPackage: mockPackages[0],
      tool: {} as Tool,
    });

    const result = await inferWorkspaces(mockCwd);

    expect(result).toStrictEqual({
      "/repo/packages/app-a": {},
    });
  });

  it("should handle nested workspace structures", async () => {
    const mockPackages = [
      {
        dir: join(mockCwd, "apps/web"),
        packageJson: { name: "web" },
      },
      {
        dir: join(mockCwd, "apps/mobile"),
        packageJson: { name: "mobile" },
      },
      {
        dir: join(mockCwd, "packages/ui/components"),
        packageJson: { name: "components" },
      },
      {
        dir: join(mockCwd, "packages/ui/icons"),
        packageJson: { name: "icons" },
      },
    ] as Package[];

    mockGetPackages.mockResolvedValue({
      packages: mockPackages,
      rootDir: mockCwd,
      rootPackage: undefined,
      tool: {} as Tool,
    });

    const result = await inferWorkspaces(mockCwd);

    expect(result).toStrictEqual({
      "/repo/apps/mobile": {},
      "/repo/apps/web": {},
      "/repo/packages/ui/components": {},
      "/repo/packages/ui/icons": {},
    });
  });

  it("should handle getPackages with rootPackage", async () => {
    const rootPkg = { dir: mockCwd, packageJson: { name: "root" } } as Package;
    const mockPackages = [
      rootPkg,
      { dir: join(mockCwd, "packages/app"), packageJson: { name: "app" } },
    ] as Package[];

    mockGetPackages.mockResolvedValue({
      packages: mockPackages,
      rootDir: mockCwd,
      rootPackage: rootPkg,
      tool: {} as Tool,
    });

    const result = await inferWorkspaces(mockCwd);

    expect(result).toStrictEqual({
      "/repo/packages/app": {},
    });
  });

  it("should handle cross-platform paths correctly", async () => {
    const mockPackages = [
      { dir: join(mockCwd, "packages", "app"), packageJson: { name: "app" } },
    ] as Package[];

    mockGetPackages.mockResolvedValue({
      packages: mockPackages,
      rootDir: mockCwd,
      rootPackage: undefined,
      tool: {} as Tool,
    });

    const result = await inferWorkspaces(mockCwd);

    expect(result).toStrictEqual({
      [join("/", "repo", "packages", "app")]: {},
    });
  });
});
