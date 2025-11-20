import type { Packages } from "@manypkg/get-packages";

import { getPackages } from "@manypkg/get-packages";

import { getWorkspacePaths } from "./get-workspace-paths";

vi.mock("@manypkg/get-packages", () => ({
  getPackages: vi.fn(),
}));

const mockedGetPackages = vi.mocked(getPackages);

describe("getWorkspacePaths", () => {
  const cwd = "/repo";

  beforeEach(() => {
    mockedGetPackages.mockReset();
  });

  it("should return unique workspace directories including root", async () => {
    mockedGetPackages.mockResolvedValue({
      packages: [
        {
          dir: "/repo/packages/a",
        },
        {
          dir: "/repo/packages/b",
        },
        {
          dir: "/repo/packages/a",
        },
      ],
      rootPackage: {
        dir: "/repo",
      },
    } as Packages);

    const result = await getWorkspacePaths(cwd);

    expect(mockedGetPackages).toHaveBeenCalledWith(cwd);
    expect(result).toStrictEqual([
      "/repo",
      "/repo/packages/a",
      "/repo/packages/b",
    ]);
  });

  it("should filter out packages without a dir", async () => {
    mockedGetPackages.mockResolvedValue({
      packages: [
        {
          dir: "/repo/packages/a",
        },
        {
          dir: undefined,
        },
        {
          dir: undefined,
        },
      ],
      rootPackage: {
        dir: "/repo",
      },
    } as Packages);

    const result = await getWorkspacePaths(cwd);

    expect(result).toStrictEqual(["/repo", "/repo/packages/a"]);
  });

  it("should still work when rootPackage is missing or has no dir", async () => {
    mockedGetPackages.mockResolvedValue({
      packages: [
        {
          dir: "/repo/packages/a",
        },
      ],
      rootPackage: {},
    } as Packages);

    const result = await getWorkspacePaths(cwd);

    expect(result).toStrictEqual(["/repo/packages/a"]);
  });
});
