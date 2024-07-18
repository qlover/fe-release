import test from 'ava';
import { Shell } from '@qlover/fe-node-lib';

test('should run release.js success', async (t) => {
  const shell = new Shell();

  const stdout = await shell.exec('npm run release');

  t.is(stdout.includes('SUCCESS Release Finished'), true);
});
