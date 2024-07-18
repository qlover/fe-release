import test from 'ava';
import PluginVersion from '../packages/lib/plugin/PluginVersion.js';

test('should be print PluginVersion domain', async (t) => {
  const pluginVersion = new PluginVersion({ domain: 'PluginVersion' });

  t.is(pluginVersion.domain, 'PluginVersion');
});

test('should increment latest version', async (t) => {
  const v = new PluginVersion({ domain: 'PluginVersion' });

  const latestVersion = '1.0.0';
  t.is(v.incrementVersion({ latestVersion }), '1.0.1');
});
