import test from 'ava';
import Version from '../packages/lib/plugins/Version.js';
import { Scheduler } from '../packages/lib/Scheduler.js';

const scheduler = new Scheduler({});

test('should be print PluginVersion namespace', async (t) => {
  const version = new Version({
    namespace: 'PluginVersion',
    container: scheduler.container
  });

  t.is(version.namespace, 'PluginVersion');
});

test('should increment latest version', async (t) => {
  const v = new Version({ container: scheduler.container });

  const latestVersion = '1.0.0';
  t.is(v.incrementVersion({ latestVersion }), '1.0.1');
  t.is(v.incrementVersion({ latestVersion, increment: false }), latestVersion);
  t.is(v.incrementVersion({ latestVersion, increment: 'major' }), '2.0.0');
  t.is(v.incrementVersion({ latestVersion, increment: 'minor' }), '1.1.0');
  t.is(v.incrementVersion({ latestVersion, increment: 'patch' }), '1.0.1');
  t.is(v.incrementVersion({ latestVersion, increment: 'premajor' }), '2.0.0-0');
  t.is(v.incrementVersion({ latestVersion, increment: 'preminor' }), '1.1.0-0');
  t.is(v.incrementVersion({ latestVersion, increment: 'prepatch' }), '1.0.1-0');
  t.is(
    v.incrementVersion({ latestVersion, increment: 'prerelease' }),
    '1.0.1-0'
  );
});
