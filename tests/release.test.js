import test from 'ava';
import { Shell } from '@qlover/fe-node-lib';
import { Loader } from '../packages/lib/Loader.js';
import Version from '../packages/lib/plugins/Version.js';
import { Scheduler } from '../packages/lib/Scheduler.js';

const pkg = Loader.getLocalPackageJSON();
const latestVersion = pkg.version;
const scheduler = new Scheduler();

const shell = new Shell();

test.skip('should not inc Version(--no-increment --no-git.commit) ci evn', async (t) => {
  const stdout = await shell.exec(
    'node ./packages/bin/release --no-increment --ci --no-git.commit',
    {
      silent: true
    }
  );
  t.is(stdout.includes(pkg.version), true);

  const stdout2 = await shell.exec(
    'node ./packages/bin/release -i major --no-increment --no-git.commit --ci',
    {
      silent: true
    }
  );
  t.is(stdout2.includes(pkg.version), true);
});

test.skip('should not inc Version(-i)', async (t) => {
  const version = new Version({ container: scheduler.container });

  const types = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch'];

  for (const type of types) {
    const stdout2 = await shell.exec(
      `node ./packages/bin/release -i ${type} --no-git.commit --ci`,
      {
        silent: true
      }
    );

    t.is(
      stdout2.includes(
        version.incrementVersion({ latestVersion, increment: type })
      ),
      true
    );
  }
});

// TODO: use sinon test input
test.skip('should run release.js success', async (t) => {});
