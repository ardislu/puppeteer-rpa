# puppeteer-rpa

Simple orchestrator to execute and log puppeteer recordings for robotic process automation (RPA) purposes. Designed to execute scripts generated by Chrome DevTools' [Recording feature](https://developers.google.com/web/updates/2021/01/devtools#record) (available in Chrome 89+ only).

## Install

1. Install [Deno](https://deno.land/) and `git`
2. Install `deno-puppeteer` and a browser binary for Puppeteer to use:

Using `bash`:

```bash
PUPPETEER_PRODUCT=chrome deno run -A --unstable https://deno.land/x/puppeteer@9.0.2/install.ts # For chromium
PUPPETEER_PRODUCT=firefox deno run -A --unstable https://deno.land/x/puppeteer@9.0.2/install.ts # For firefox
```

Using `PowerShell` ([reference](https://github.com/PowerShell/PowerShell/issues/3316)):

```PowerShell
# For chromium
try {
  $oldValue = $env:PUPPETEER_PRODUCT
  $env:PUPPETEER_PRODUCT = "chrome"
  deno run -A --unstable https://deno.land/x/puppeteer@9.0.2/install.ts
}
finally {
  $env:PUPPETEER_PRODUCT = $oldValue
}

# For firefox
try {
  $oldValue = $env:PUPPETEER_PRODUCT
  $env:PUPPETEER_PRODUCT = "firefox"
  deno run -A --unstable https://deno.land/x/puppeteer@9.0.2/install.ts
}
finally {
  $env:PUPPETEER_PRODUCT = $oldValue
}
```

Reference [deno-puppeteer](https://github.com/lucacasonato/deno-puppeteer) for more details.

3. Clone this repo

```
git clone https://github.com/ardislu/puppeteer-rpa.git
```

4. `cd puppeteer-rpa`

## Use

1. Make a puppeteer recording by using Chrome DevTools' [Recording feature](https://developers.google.com/web/updates/2021/01/devtools#record) (available in Chrome 89+ only)
2. Copy the recording into a standalone file in the `recordings` folder
3. `deno run -A ./src/index.ts`

## config.ts

Modify the `config` object in `config.ts` to change default settings for the orchestrator.

## Notes

- The orchestrator will run all recordings in parallel.
- Example recordings are included for completing the forms on [jec.fyi](https://jec.fyi/demo/recorder) and [rpachallenge](http://www.rpachallenge.com/).
- For simplicity, the orchestrator does not allow you to configure the puppeteer settings of individual scripts. If you need to set puppeteer launch settings (examples: `headless: false` or `slowMo: 10`), customize the individual recording scripts.
