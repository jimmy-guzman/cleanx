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
