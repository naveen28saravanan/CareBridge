import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logsDir = path.resolve('logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level.toUpperCase()}]: ${message}`)
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => `[${timestamp}] [${level}]: ${message}`)
      )
    }),
    new winston.transports.File({ filename: path.join(logsDir, 'app.log') }),
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' })
  ]
});

export const executionLogs = [];

export function logStep(testName, stepDescription, result = 'PASSED', remarks = '') {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const logObj = { timestamp, testName, stepDescription, result, remarks };
  executionLogs.push(logObj);
  logger.info(`[${testName}] ${stepDescription} - ${result} ${remarks ? `(${remarks})` : ''}`);
}

export default logger;
