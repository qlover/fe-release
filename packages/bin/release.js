#!/usr/bin/env node
import { Logger } from '@qlover/fe-node-lib';
import { Scheduler } from '../lib/Scheduler.js';

async function main() {
  const log = new Logger();

  await Scheduler.release();

  log.success('Release Finished');
}

main();
