import { defineCommand } from "citty";

import {
  description,
  name,
  version,
  // eslint-disable-next-line import-x/extensions -- this is a package.json import
} from "../../package.json" assert { type: "json" };

export const main = defineCommand({
  args: {
    config: {
      description: "Path to config file",
      type: "string",
    },
    cwd: {
      description: "Set working directory",
      type: "string",
    },
    dryRun: {
      description: "Show what would be deleted without actually deleting",
      type: "boolean",
    },
    profile: {
      default: "default",
      description: "Cleaning profile to use",
      type: "string",
    },
  },
  meta: {
    description,
    name,
    version,
  },
  async run(ctx) {
    const { runClean } = await import("./run-clean");

    await runClean(ctx.args);
  },
});
