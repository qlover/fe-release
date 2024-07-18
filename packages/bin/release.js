#!/usr/bin/env node
import { Logger } from '@qlover/fe-node-lib';

async function main() {
  const log = new Logger();
  log.success('Release Finished');
}

main();
