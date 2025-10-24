import * as winston from "winston";
import "winston-daily-rotate-file";
import { LoggerService } from "@nestjs/common";

// Configure daily rotation file transport
const transport = new winston.transports.DailyRotateFile({
  filename: "logs/%DATE%.log",
  datePattern: "YYYY-MM-DD",
  maxFiles: "7d", // Keep logs for 7 days
  level: "info", // Define the log level
});

// Create a custom logger using winston
const winstonLogger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
    transport,
  ],
});

// Create a NestJS-compatible logger
export class WinstonLogger implements LoggerService {
  log(message: string, context?: string) {
    winstonLogger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    winstonLogger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    winstonLogger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    winstonLogger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    winstonLogger.verbose(message, { context });
  }
}

// Export the logger instance for backward compatibility
export const logger = new WinstonLogger();
