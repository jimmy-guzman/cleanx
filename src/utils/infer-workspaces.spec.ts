import { join } from "node:path";

import type { Package, Tool } from "@manypkg/get-packages";

import { getPackages } from "@manypkg/get-packages";

import { inferWorkspaces } from "./infer-workspaces";

vi.mock("@manypkg/get-packages");

const mockGetPackages = vi.mocked(getPackages);

const mockCwd = "/repo";

const mockPackages = [
  {
    dir: join(mockCwd, "packages/app-a"),
    packageJson: { name: "app-a", version: "0.0.0" },
    relativeDir: "packages/app-a",
  },
  {
    dir: join(mockCwd, "packages/app-b"),
    packageJson: { name: "app-b", version: "0.0.0" },
    relativeDir: "packages/app-b",
  },
] satisfies Package[];

describe("inferWorkspaces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return empty array when getPackages throws", async () => {
    mockGetPackages.mockRejectedValue(new Error("No packages found"));

    const result = await inferWorkspaces(mockCwd);

    expect(result).toStrictEqual([]);

    expect(mockGetPackages).toHaveBeenCalledWith(mockCwd);
  });

  it("should return empty array when no packages found", async () => {
    mockGetPackages.mockResolvedValue({
      packages: [],
      rootDir: mockCwd,
      rootPackage: undefined,
      tool: {} as Tool,
    });

    const result = await inferWorkspaces(mockCwd);

    expect(result).toStrictEqual([]);
  });

  it("should include packages that are within cwd", async () => {
    mockGetPackages.mockResolvedValue({
      packages: mockPackages,
      rootDir: mockCwd,
      rootPackage: undefined,
      tool: {} as Tool,
    });

    const result = await inferWorkspaces(mockCwd);

    expect(result).toStrictEqual(mockPackages);
  });

  it("should exclude root package (current directory)", async () => {
    const rootPackage = {
      dir: mockCwd,
      packageJson: { name: "root", version: "0.0.0" },
      relativeDir: "repo",
    };

    mockGetPackages.mockResolvedValue({
      packages: [
        ...mockPackages,
        {
          dir: mockCwd,
          packageJson: { name: "root", version: "0.0.0" },
          relativeDir: "repo",
        },
      ],
      rootDir: mockCwd,
      rootPackage,
      tool: {} as Tool,
    });

    const result = await inferWorkspaces(mockCwd);

    expect(result).toStrictEqual(mockPackages);
  });
});
