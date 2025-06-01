/**
 * Utility function to return the correct singular or plural form of a word based on a count.
 * If the count is 1, it returns the singular form; otherwise, it returns the plural form.
 * If no plural form is provided, it defaults to appending 's' to the singular form.
 *
 * @param count - The count to determine singular or plural form.
 *
 * @param singular - The singular form of the word.
 *
 * @param pluralForm - The plural form of the word (optional). If not provided, defaults to singular + 's'.
 *
 * @returns Just the word in singular or plural form (no count included).
 *
 * @example
 * plural(1, "apple") // "apple"
 * plural(2, "apple") // "apples"
 * plural(2, "child", "children") // "children"
 *
 * // Usage with count
 * `${count} ${plural(count, "workspace")}` // "1 workspace" or "2 workspaces"
 */
export function plural(
  count: number,
  singular: string,
  pluralForm?: string,
): string {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}
