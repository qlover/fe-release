import { oraPromise } from 'ora';
import { format } from './utils.js';

export default class Spinner {
  constructor() {
    this.ora = oraPromise;
  }

  show({ enabled = true, task, label, context }) {
    if (!enabled) return Promise.resolve();

    const awaitTask = task();

    const text = format(label, context);
    this.ora(awaitTask, text);

    return awaitTask;
  }
}
