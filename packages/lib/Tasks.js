import inquirer from 'inquirer';
import { oraPromise } from 'ora';
import Util from './Util.js';
import { TasksTypes } from '../config/TasksConst.js';
export default class Tasks {
  constructor(config) {
    this.createPrompt = inquirer.prompt;
    this.ora = oraPromise;

    /** @type {import('./Config.js').default} */
    this.config = config;
    this.tasks = new Map();
  }

  /**
   * @param {import('@qlover/fe-release').TaskInterface | import('@qlover/fe-release').TaskInterface[]} tasks
   */
  register(tasks) {
    tasks = Array.isArray(tasks) ? tasks : [tasks];
    tasks.forEach((task) => {
      if (!task.id) {
        throw new Error('Task Id is undefined');
      }

      this.tasks.set(task.id, task);
    });
  }

  /**
   *
   * @param {import('@qlover/fe-release').TaskInterface} param0
   * @returns
   */
  async actionPrompt({
    message,
    transformer,
    id,
    choices,
    context,
    run,
    ...props
  }) {
    const answers = await this.createPrompt([
      {
        ...props,
        name: id,
        message: message(context),
        choices: choices ? choices(context) : [],
        transformer: transformer ? transformer(context) : undefined
      }
    ]);

    const doExecute = props.type === 'confirm' ? answers[id] : true;

    return doExecute && run
      ? await run({ type: TasksTypes.MUTUAL, value: answers[id] })
      : false;
  }

  /**
   * @param {import('@qlover/fe-release').TaskInterface} param0
   * @returns
   */
  actionSpinner({ id, run, label, context }) {
    let awaitTask = run({ type: TasksTypes.AUTO });

    // check run returan a promise
    if (!(awaitTask instanceof Promise)) {
      awaitTask = Promise.resolve(awaitTask);
    }

    const text = label ? Util.format(label, context) : id;
    this.ora(awaitTask, text);

    return awaitTask;
  }

  /**
   * @param {import('@qlover/fe-release').TaskInterface | string} task
   */
  dispatch(task) {
    if (!task.id) {
      throw new Error('Task Id is undefined!');
    }
    /** @type {import('@qlover/fe-release').TaskInterface */
    const runTask = Object.assign({}, this.tasks.get(task.id), task);
    const { enabled = true, runType, ...props } = runTask;

    if (!enabled) {
      return Promise.resolve();
    }

    if (runType === 'prompt') {
      return this.actionPrompt(props);
    }

    return this.actionSpinner(props);
  }
}
