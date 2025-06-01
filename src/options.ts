/**
 * Configuration options for cleanx cleaning operations.
 */
export interface CleanxOptions {
  /**
   * Preview what would be deleted without actually deleting files.
   *
   * @default false
   */
  dryRun?: boolean;

  /**
   * Glob patterns for files and directories to exclude from deletion.
   * These patterns take precedence over include patterns.
   *
   * @example ["node_modules", ".env", "*.log"]
   */
  exclude?: string[];

  /**
   * Glob patterns for files and directories to include for deletion.
   *
   * @example ["dist", "build", "coverage", ".cache"]
   */
  include?: string[];

  /**
   * Named cleaning profiles that define reusable sets of include/exclude patterns.
   * Profiles cannot contain nested profiles or workspace configurations.
   *
   * @example
   * ```ts
   * profiles: {
   *   dev: { include: ["dist", ".cache"] },
   *   ci: { include: ["coverage", "build"] }
   * }
   * ```
   */
  profiles?: Record<
    string,
    Partial<Omit<CleanxOptions, "profiles" | "workspaces">>
  >;

  /**
   * Workspace-specific configuration overrides keyed by glob patterns.
   * Each workspace config extends the root config and cannot define profiles.
   * The dryRun setting is inherited from the root config and cannot be overridden.
   *
   * @example
   * ```ts
   * workspaces: {
   *   "apps/*": { exclude: ["public/uploads"] },
   *   "packages/ui": { include: ["storybook-static"] }
   * }
   * ```
   */
  workspaces?: Record<
    string,
    Partial<Omit<CleanxOptions, "dryRun" | "profiles">>
  >;
}
