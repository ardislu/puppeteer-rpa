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
const { dirArg, execArg, synchronous, headless, slowMo, screenshot } = parse(Deno.args, {
  string: ['dirArg', 'execArg', 'slowMo'],
  boolean: ['synchronous', 'headless', 'screenshot'],
  alias: {
    'dirArg': ['dir', 'D'],
    'execArg': ['exec', 'E'],
    'synchronous': ['sync']
  },
  default: {
    'dirArg': './recordings',
    'execArg': '*.js',
    'synchronous': false,
    'headless': false,
    'slowMo': 0,
    'screenshot': false
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
      recordings.push(file);
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

/* Execute the recordings */
const importString = 'import puppeteer from "https://deno.land/x/puppeteer@9.0.2/mod.ts";';
const puppeteerSettings = {
  headless: headless,
  slowMo: parseInt(slowMo)
};
for (const rec of recordings) {
  logger.info(`Opened ${rec.name}`);
  // WARNING: these hardcoded string replacements will break if Chrome's recording generator changes
  const scriptPromise = Deno.readTextFile(rec.path)
    .then(s => s.replace("const puppeteer = require('puppeteer');", importString)) // Replace CJS import with ESM import
    .then(s => s.replace("const browser = await puppeteer.launch();", `const browser = await puppeteer.launch(${JSON.stringify(puppeteerSettings)});`)) // Inject puppeteer settings
    // Will take the screenshot immediately before closing the browser - this is not optimal because if the form is already submitted then the form may already be cleared.
    .then(s => screenshot ? s.replace("await browser.close();", `await page.screenshot({ path: '${startTime}-${rec.name}.png' });\nawait browser.close();`) : s) // Inject screenshot
  const tempFilePromise = Deno.makeTempFile();
  const [script, tempFile] = await Promise.all([scriptPromise, tempFilePromise]);
  await Deno.writeTextFile(tempFile, script);

  const proc = Deno.run({
    cmd: ["deno", "run", "-A", "--unstable", tempFile],
  });
  const status = proc.status()
    .then(_ => logger.info(`Closed ${rec.name}.`))
    .catch(e => logger.error(`Error occurred while executing "${rec.name}": ${e}`))
    .finally(() => Deno.remove(tempFile));
  if (synchronous) {
    await status;
  }
}
