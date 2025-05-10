import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, errors, colorize } = format;

const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

const logger = createLogger({
  level: "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true })
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), consoleFormat),
    }),

    new transports.File({
      filename: "logs/combined.log",
      format: format.json(),
    }),
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      format: format.json(),
    }),
  ],
});

export default logger;
