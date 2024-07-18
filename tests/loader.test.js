import test from 'ava';
import { Loader } from '../packages/lib/Loader.js';
import { resolve } from 'path';

test('should be PluginVersion', async (t) => {
  const plugins = Loader.readFilePlugins(resolve('./packages/lib/plugin'));
  t.is(plugins.includes('PluginVersion'), true);
});
