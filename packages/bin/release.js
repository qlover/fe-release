#!/usr/bin/env node
import { Scheduler } from '../lib/Scheduler.js';
import { program } from 'commander';
import { Logger } from '@qlover/fe-node-lib';
import { Loader } from '../lib/Loader.js';
import lodash from 'lodash';

function flattenToNested(obj) {
  const result = {};
  Object.keys(obj).forEach((key) => {
    lodash.set(result, key, obj[key]);
  });
  return result;
}

function getArgs() {
  const pkg = Loader.getLocalPackageJSON();

  program.version(pkg.version);
  program
    .option(
      '-i, --increment <type>',
      'Increment "major", "minor", "patch", or "pre*" version; or specify version'
      // 'patch'
    )
    .option('--no-increment', 'Disable version increment')
    .option('--no-git.commit', 'Disable commit modified')
    .option(
      '--ci',
      'No prompts, no user interaction; activated automatically in CI environments'
    )
    .option('--debug', 'Print verbose and debug output');

  program.parse();

  return program.opts();
}

async function main() {
  const options = getArgs();
  const scheduler = new Scheduler(flattenToNested(options));
  const log = new Logger();

  await scheduler.release();

  log.info('Release Finished');
}

main();
