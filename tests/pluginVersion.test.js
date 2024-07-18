import test from 'ava';
import PluginVersion from '../packages/lib/plugin/PluginVersion.js';

test('should be print PluginVersion domain', async (t) => {
  const pluginVersion = new PluginVersion();

  t.is(pluginVersion.domain, 'PluginVersion');
});
