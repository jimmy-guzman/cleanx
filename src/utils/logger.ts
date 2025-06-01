import { bgRed, bgYellow, blue, green } from "ansis";

export const logger = {
  error: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.error("\n", bgRed` ERROR `, ...msg, "\n");
  },

  info: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.info(blue`ℹ`, ...msg);
  },

  success: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.log(green("✔"), ...msg);
  },

  warn: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.warn("\n", bgYellow` WARN `, ...msg, "\n");
  },
};
