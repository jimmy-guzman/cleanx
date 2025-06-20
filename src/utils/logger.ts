import { styleText } from "node:util";

export const logger = {
  error: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.error("\n", styleText("bgRed", " ERROR "), ...msg, "\n");
  },

  info: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.info(styleText("blue", "ℹ"), ...msg);
  },

  success: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.log(styleText("green", "✔"), ...msg);
  },

  warn: (...msg: unknown[]) => {
    // eslint-disable-next-line no-console -- this is a logger utility
    console.warn("\n", styleText("bgYellow", " WARN "), ...msg, "\n");
  },
};
