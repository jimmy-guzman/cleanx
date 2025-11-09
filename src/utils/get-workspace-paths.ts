import type { Packages } from "@manypkg/get-packages";

export const getWorkspacePaths = ({ packages, rootPackage }: Packages) => {
  return [
    ...new Set(
      [rootPackage, ...packages].map((pkg) => pkg?.dir).filter(Boolean),
    ),
  ];
};
