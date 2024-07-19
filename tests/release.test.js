import test from 'ava';
import { Shell } from '@qlover/fe-node-lib';
import { Loader } from '../packages/lib/Loader.js';
import PluginVersion from '../packages/lib/plugin/PluginVersion.js';

const pkg = Loader.loadPackageJSON();
const latestVersion = pkg.version;

const shell = new Shell();
test('should not inc Version(--no-increment)', async (t) => {
  const stdout = await shell.exec(
    'node ./packages/bin/release --no-increment',
    {
      silent: true
    }
  );
  t.is(stdout.includes(pkg.version), true);

  const stdout2 = await shell.exec(
    'node ./packages/bin/release -i major --no-increment',
    {
      silent: true
    }
  );
  t.is(stdout2.includes(pkg.version), true);
});

test('should not inc Version(-i)', async (t) => {
  const pluginVersion = new PluginVersion({ domain: 'PluginVersion' });

  const types = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch'];

  for (const type of types) {
    const stdout2 = await shell.exec(`node ./packages/bin/release -i ${type}`, {
      silent: true
    });

    t.is(
      stdout2.includes(
        pluginVersion.incrementVersion({ latestVersion, increment: type })
      ),
      true
    );
  }
});

test('should run release.js success', async (t) => {
  const stdout = await shell.exec('node ./packages/bin/release', {
    silent: true
  });

  t.is(stdout.includes('SUCCESS Release Finished'), true);
});
