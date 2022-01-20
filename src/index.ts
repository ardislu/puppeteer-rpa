import * as log from "https://deno.land/std@0.121.0/log/mod.ts";
import config from "./config.ts";

const startTime = Date.now();

const logFormatter = (r: log.LogRecord) => `${r.datetime.toISOString()} | ${r.levelName} | ${r.msg}`;
await log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", { formatter: logFormatter }),

    infoFile: new log.handlers.FileHandler("INFO", {
      filename: `./logs/${startTime}-INFO.log`,
      formatter: logFormatter,
    }),

    errorFile: new log.handlers.FileHandler("ERROR", {
      filename: `./logs/${startTime}-ERROR.log`,
      formatter: logFormatter,
    }),
  },

  loggers: {
    default: {
      handlers: ["console", "infoFile", "errorFile"],
    },
  },
});

const logger = log.getLogger();

// Compare actualRecordings with recordingsToExecute and only add valid recordings
let recordings: string[] = [];
const actualRecordings = Array.from(Deno.readDirSync(config.recordingsDir)).map(e => e.name);
if (config.recordingsToExecute.length === 0) { // Empty recordingsToExecute --> execute all recordings
  recordings = actualRecordings;
}
else {
  for (const rec of config.recordingsToExecute) {
    if (actualRecordings.includes(rec)) {
      recordings.push(rec);
    }
    else {
      logger.warning(
        `No recording named "${rec}" in "${config.recordingsDir}".`,
      );
    }
  }
}

if (recordings.length === 0) {
  logger.error(
    `No recordings to execute. Check these configurations are correct:
      recordingsDir: ${config.recordingsDir}
      recordingsToExecute: ${config.recordingsToExecute}`,
  );
}

for (const rec of recordings) {
  logger.info(`Opened ${rec}`);
  const proc = Deno.run({
    cmd: ["deno", "run", "-A", "--unstable", `${config.recordingsDir}/${rec}`],
  });
  proc.status().then((status) =>
    logger.info(`Closed ${rec} with code ${status.code}.`)
  );
}
