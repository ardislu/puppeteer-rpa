import { join } from 'path';

interface puppeteerRpaConfig {
  recordingsDir: string,
  recordingsToExecute: string[],
  silent: boolean
}

const config: puppeteerRpaConfig = {
  recordingsDir: join(__dirname, '../recordings'),
  recordingsToExecute: [],
  silent: false
}

export default config;
