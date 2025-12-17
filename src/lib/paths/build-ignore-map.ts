import type { Ignore } from "ignore";

import { readFile } from "node:fs/promises";
import { dirname } from "node:path";

import { log } from "../logging/log";

export async function buildIgnoreMap(gitignoreFiles: string[]) {
  const { default: ignore } = await import("ignore");
  const ignoreMap = new Map<string, Ignore>();

  const results = await Promise.allSettled(
    gitignoreFiles.map(async (gitignorePath) => {
      const content = await readFile(gitignorePath, "utf8");

      return { content, path: gitignorePath };
    }),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      const { content, path } = result.value;
      const ignorer = ignore().add(content);

      ignoreMap.set(dirname(path), ignorer);
    } else {
      log.warn(`Failed to read gitignore: ${result.reason}`);
    }
  }

  return ignoreMap;
}
