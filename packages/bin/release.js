#!/usr/bin/env node
import { Scheduler } from '../lib/Scheduler.js';
import { program } from 'commander';
import { Logger } from '@qlover/fe-node-lib';
import { Loader } from '../lib/Loader.js';

function getArgs() {
  const pkg = Loader.loadPackageJSON();

  program.version(pkg.version);
  program
    .option(
      '-i, --increment <type>',
      'Increment "major", "minor", "patch", or "pre*" version; or specify version'
      // 'patch'
    )
    .option('--no-increment', 'Disable version increment')
    .option('--no-commit', 'Disable commit modified')
    .option(
      '--ci',
      'No prompts, no user interaction; activated automatically in CI environments'
    );

  program.parse();

  return program.opts();
}

async function main() {
  const options = getArgs();
  const scheduler = new Scheduler({ argv: options });
  const log = new Logger();

  await scheduler.release();

  log.info('Release Finished');
}

main();
