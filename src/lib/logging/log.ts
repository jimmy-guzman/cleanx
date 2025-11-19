import { ERROR, INFO, SUCCESS, WARN } from "../colors";

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
