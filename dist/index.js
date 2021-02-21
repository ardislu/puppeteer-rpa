"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
const winston_1 = require("winston");
const config_1 = __importDefault(require("./config"));
// Date.now() returns a number (milliseconds since January 1, 1970) which is appropriate for a file name.
// new Date() returns a Date object which contains inappropriate characters for a file name (colons, :) when casted to a string.
const startTime = Date.now();
const logger = winston_1.createLogger({
    transports: [
        new winston_1.transports.Console(),
        new winston_1.transports.File({ filename: path_1.join(__dirname, `../logs/${startTime}-ERROR.log`), level: 'error' }),
        new winston_1.transports.File({ filename: path_1.join(__dirname, `../logs/${startTime}-INFO.log`), level: 'info' })
    ],
    format: winston_1.format.combine(winston_1.format.timestamp({ format: () => new Date().toLocaleString() }), winston_1.format.printf(({ level, message, timestamp }) => `[${timestamp}] ${level}: ${message}`)),
    silent: config_1.default.silent
});
// Compare actualRecordings with recordingsToExecute and only add valid recordings
let recordings = [];
const actualRecordings = fs_1.readdirSync(config_1.default.recordingsDir);
if (config_1.default.recordingsToExecute.length === 0) { // Empty recordingsToExecute --> execute all recordings
    recordings = actualRecordings;
}
else {
    for (const rec of config_1.default.recordingsToExecute) {
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
  recordingsDir: ${config_1.default.recordingsDir}
  recordingsToExecute: ${config_1.default.recordingsToExecute}`);
}
for (const rec of recordings) {
    logger.info(`Opened ${rec}`);
    const proc = child_process_1.fork(path_1.join(config_1.default.recordingsDir, rec));
    proc.addListener('close', () => logger.info(`Closed ${rec}`));
}
