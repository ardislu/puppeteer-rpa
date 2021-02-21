import { readdirSync } from 'fs';
import { join } from 'path';
import { fork } from 'child_process';
import { createLogger, transports, format } from 'winston';
import config from './config';

// Date.now() returns a number (milliseconds since January 1, 1970) which is appropriate for a file name.
// new Date() returns a Date object which contains inappropriate characters for a file name (colons, :) when casted to a string.
const startTime = Date.now();
const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.File({ filename: join(__dirname, `../logs/${startTime}-ERROR.log`), level: 'error' }),
    new transports.File({ filename: join(__dirname, `../logs/${startTime}-INFO.log`), level: 'info' })
  ],
  format: format.combine(
    format.timestamp({ format: () => new Date().toLocaleString() }),
    format.printf(({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`)
  ),
  silent: config.silent
});

// Compare actualRecordings with recordingsToExecute and only add valid recordings
let recordings: string[] = [];
const actualRecordings = readdirSync(config.recordingsDir);
if (config.recordingsToExecute.length === 0) { // Empty recordingsToExecute --> execute all recordings
  recordings = actualRecordings;
}
else {
  for (const rec of config.recordingsToExecute) {
    if (actualRecordings.includes(rec)) {
      recordings.push(rec);
    }
    else {
      logger.warn(`Recording not found: ${rec}`);
    }
  }
}

if (recordings.length === 0) {
  logger.error(`No recordings to execute. Check these configurations are correct:
  recordingsDir: ${config.recordingsDir}
  recordingsToExecute: ${config.recordingsToExecute}`);
}

for (const rec of recordings) {
  logger.info(`Opened ${rec}`);
  const proc = fork(join(config.recordingsDir, rec));
  proc.addListener('close', () => logger.info(`Closed ${rec}`));
}
