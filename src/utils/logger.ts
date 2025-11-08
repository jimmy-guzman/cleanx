import { styleText as c } from "node:util";

export const INFO = c("blue", "i");
export const SUCCESS = c("green", "✔");
export const WARN = c("yellow", "⚠");
export const ERROR = c("red", "✖");

export const suffix = (dryRun: boolean) => {
  return dryRun ? c("yellow", " (dry run)") : "";
};

export const ws = (workspaceDir: string) => {
  return c("blue", workspaceDir);
};

export const dim = (text: string) => {
  return c("gray", text);
};

export const log = {
  error: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.error("\n", ERROR, ...msg, "\n");
  },

  info: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.info(INFO, ...msg);
  },

  line: () => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.log();
  },

  message: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.info(...msg);
  },

  success: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.log(SUCCESS, ...msg);
  },

  warn: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.warn("\n", WARN, ...msg, "\n");
  },
};
