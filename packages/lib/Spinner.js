import { oraPromise } from 'ora';
import ContextFormat from './utils/ContextFormat.js';

export default class Spinner {
  constructor() {
    this.ora = oraPromise;
  }

  show({ enabled = true, task, label, context }) {
    if (!enabled) return Promise.resolve();

    let awaitTask = task();

    // whether Promise?
    if (!(awaitTask instanceof Promise)) {
      awaitTask = Promise.resolve(awaitTask);
    }

    const text = ContextFormat.format(label, context);
    this.ora(awaitTask, text);

    return awaitTask;
  }
}
