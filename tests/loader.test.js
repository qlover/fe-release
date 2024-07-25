import test from 'ava';
import { Loader } from '../packages/lib/Loader.js';
import { resolve } from 'path';

test('should be Version', async (t) => {
  const plugins = Loader.readFilePlugins(resolve('./packages/lib/plugins'));
  t.is(plugins.includes('Version'), true);
});
