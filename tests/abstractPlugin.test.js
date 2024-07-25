import test from 'ava';
import AbstractPlugin from '../packages/lib/PluginBase.js';

test('should be throw domain required error', async (t) => {
  t.throws(() => new AbstractPlugin({}), {
    message: /^namespace is required!/
  });
});
