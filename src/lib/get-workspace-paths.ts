export const getWorkspacePaths = ({
  packages,
  rootPackage,
}: {
  packages: { dir?: string }[];
  rootPackage?: { dir?: string };
}) => {
  return [
    ...new Set(
      [rootPackage, ...packages].map((pkg) => pkg?.dir).filter(Boolean),
    ),
  ];
};
