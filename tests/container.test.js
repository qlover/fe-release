import test from 'ava';
import { Container } from '../packages/lib/Container.js';

test('container register', async (t) => {
  const container = new Container();

  container.register('Test', { name: 'testName' });

  t.throws(() => container.get('NoTest'), {
    message: /^identiter NoTest not register/
  });

  t.is(container.get('Test').name, 'testName');
});
