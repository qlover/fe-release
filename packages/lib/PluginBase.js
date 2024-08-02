import { Logger, Shell } from '@qlover/fe-node-lib';
import Config from './Config.js';
import Tasks from './Tasks.js';
import lodash from 'lodash';

/**
 * @private
 * @param {import('./Container.js').Container} container
 * @param {object} param1
 * @param {object} param1.tasks
 */
function setup(container, { tasks }) {
  if (tasks) {
    /** @type {Tasks} */
    const tTasks = container.get(Tasks);
    tTasks.register(tasks);
  }
}

export default class PluginBase {
  /**
   * @param {object} props
   * @param {string} props.namespace
   * @param {import('./Container.js').Container} props.container
   */
  constructor({ namespace, container } = {}) {
    if (!namespace) {
      throw new Error('namespace is required!');
    }

    this.namespace = namespace;
    this.container = container;

    // quick instacne
    /** @type {Shell} */
    this.shell = container.get(Shell);
    /** @type {Config} */
    this.config = container.get(Config);
    /** @type {Logger} */
    this.log = container.get(Logger);
    /** @type {Tasks} */
    this.tasks = container.get(Tasks);

    /**
     * only every plugin context
     */
    this.context = {};

    setup(container, { tasks: this.getTaskList() });
  }

  /**
   * get a prompt task object.
   * @abstract
   * @returns {import('@qlover/fe-release').TaskInterface[] | import('@qlover/fe-release').TaskInterface}
   */
  getTaskList() {}

  /**
   * plugin init logic
   * @abstract
   */
  init() {}

  /**
   * plugin run logic
   * @abstract
   */
  process() {}

  getContext(path) {
    const context = lodash.merge({}, this.config.getContext(), this.context);
    return path ? lodash.get(context, path) : context;
  }

  setContext(context) {
    lodash.merge(this.context, context);
  }

  dispatchTask(options) {
    const taskOpts = Object.assign(
      {
        runType: this.config.isCI ? 'spinner' : 'prompt'
      },
      { context: this.getContext() },
      options
    );
    return this.tasks.dispatch(taskOpts);
  }

  /**
   * run command
   * @param {string | string[]} command
   * @param {object} options
   * @param {boolean} options.silent
   * @param {Record<string, any>} context
   * @returns
   */
  exec(command, options, context) {
    const ctx = Object.assign(context || {}, this.getContext());
    return this.shell.exec(command, options, ctx);
  }
}
