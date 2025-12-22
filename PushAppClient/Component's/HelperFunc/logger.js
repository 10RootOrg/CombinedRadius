import * as FileSystem from "expo-file-system";
import {
  consoleTransport,
  fileAsyncTransport,
  logger,
} from "react-native-logs";

const log = logger.createLogger({
  transport: [fileAsyncTransport, consoleTransport],
  levels: {
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    devNotice: 5,
  },
  transportOptions: {
    FS: FileSystem,
    fileName: "logs.log",

    colors: {
      devNotice: "blue",
      info: "magenta",
      warn: "yellowBright",
      error: "redBright",
      debug: "cyan",
    },
  },
  dateFormat: "local",
});
export { log };
