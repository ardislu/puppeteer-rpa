interface puppeteerRpaConfig {
  recordingsDir: string,
  recordingsToExecute: string[],
  silent: boolean
}

const config: puppeteerRpaConfig = {
  recordingsDir: "./recordings",
  recordingsToExecute: [],
  silent: false
}

export default config;
