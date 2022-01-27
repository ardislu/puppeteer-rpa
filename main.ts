import * as log from "https://deno.land/std@0.122.0/log/mod.ts";
import { parse } from "https://deno.land/std@0.122.0/flags/mod.ts";
import { expandGlob } from "https://deno.land/std@0.122.0/fs/mod.ts";

/* Set up logger configurations and initialize the logger */
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

/* Parse input flags and handle errors */
const { dirArg, execArg } = parse(Deno.args, {
  alias: {
    'dirArg': ['dir', 'D'],
    'execArg': ['exec', 'E']
  },
  default: {
    'dirArg': './recordings',
    'execArg': '*.js'
  }
});

if (Array.isArray(dirArg)) {
  logger.error(`Multiple --dir inputs are not supported. To use recordings from different directories, specify a common root
    directory with the --dir flag and then pass paths to the separate recording directories using the --exec flag. For example: 
    --dir ./common-root --exec path/to/example1/*.js --exec path/to/example2/*.js`);
  Deno.exit(1);
}

const recordingRootDirectory = await Deno.realPath(dirArg).catch(_ => {
  logger.error(`Could not resolve --dir. Check that this directory exists: ${dirArg}`);
  Deno.exit(1);
});

const execGlobs = [];
if (Array.isArray(execArg)) {
  execArg.forEach(a => execGlobs.push(...a.split(',')));
}
else {
  execGlobs.push(...execArg.split(','));
}

/* Resolve all recording file paths */
const recordings = [];
for (const glob of execGlobs) {
  if (glob === '') { // Will happen if a user mistakenly includes whitespace between args without quoting, e.g. --exec example1.js, example2.js
    logger.warning(`Ignoring empty string passed to --exec.
      When passing multiple files to the --exec flag, make sure the argument is wrapped in quotes. For example: --exec "example1.js, example2.js".
      Note that leading whitespace is NOT trimmed from file names, e.g. the example above will look for a file named " example2.js".`);
    continue;
  }
  let atLeastOneFileResolved = false;
  for await (const file of expandGlob(`${recordingRootDirectory}/${glob}`)) {
    if (file.isFile) {
      recordings.push(file.path);
      atLeastOneFileResolved = true;
    }
    else {
      logger.warning(`${file.path} is not a file.`);
    }
  }
  if (!atLeastOneFileResolved) {
    logger.warning(`"${recordingRootDirectory}/${glob}" did not resolve to any files. Skipping --exec input "${glob}".`);
  }
}

if (recordings.length === 0) {
  logger.error(
    `No recordings to execute. Check these flags are correct and resolve to valid files:
      --dir: ${dirArg}
      --exec: ${execArg}`);
  Deno.exit(1);
}

for (const rec of recordings) {
  logger.info(`Opened ${rec}`);
  const proc = Deno.run({
    cmd: ["deno", "run", "-A", "--unstable", rec],
  });
  proc.status().then((status) =>
    logger.info(`Closed ${rec} with code ${status.code}.`)
  );
}
