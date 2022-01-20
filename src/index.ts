import { parse } from "https://deno.land/std@0.121.0/flags/mod.ts";
import * as log from "https://deno.land/std@0.121.0/log/mod.ts";

// Example: deno run -A ./src/index.ts --dir ./example-directory --exec example1.js,example2.js
let { recordingsDir, recordingsToExecute } = parse(Deno.args, {
  alias: {
    'recordingsDir': ['dir', 'D'],
    'recordingsToExecute': ['exec', 'E']
  },
  default: {
    'recordingsDir': './recordings',
    'recordingsToExecute': []
  }
});

if (!Array.isArray(recordingsToExecute)) {
  recordingsToExecute = recordingsToExecute.split(',')
}

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
const actualRecordings = Array.from(Deno.readDirSync(recordingsDir)).map(e => e.name);
if (recordingsToExecute.length === 0) { // Empty recordingsToExecute --> execute all recordings
  recordings = actualRecordings;
}
else {
  for (const rec of recordingsToExecute) {
    if (actualRecordings.includes(rec)) {
      recordings.push(rec);
    }
    else {
      logger.warning(
        `No recording named "${rec}" in "${recordingsDir}".`,
      );
    }
  }
}

if (recordings.length === 0) {
  logger.error(
    `No recordings to execute. Check these configurations are correct:
      recordingsDir: ${recordingsDir}
      recordingsToExecute: ${recordingsToExecute}`,
  );
}

for (const rec of recordings) {
  logger.info(`Opened ${rec}`);
  const proc = Deno.run({
    cmd: ["deno", "run", "-A", "--unstable", `${recordingsDir}/${rec}`],
  });
  proc.status().then((status) =>
    logger.info(`Closed ${rec} with code ${status.code}.`)
  );
}
