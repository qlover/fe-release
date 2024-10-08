import { Logger, Shell } from '@qlover/fe-node-lib';
import Config from './Config.js';
import Tasks from './Tasks.js';
import lodash from 'lodash';
import { EOL } from 'node:os';

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

    setup(container, { tasks: this.getTaskList() });
  }

  debug(...args) {
    // In some places, the beginning of debug will be overwritten by a spinner line break,
    // and a line break will be added uniformly
    this.log.print(EOL);
    this.log.debug(...args);
  }

  /**
   * get a prompt task object.
   * @abstract
   * @returns {import('@qlover/fe-release').TaskInterface[] | import('@qlover/fe-release').TaskInterface}
   */
  getTaskList() {}

  /**
   * plugin init logic, because constructor not support async/await
   * @abstract
   */
  init() {}

  /** @abstract */
  processBefore() {}
  /**
   * plugin run logic
   * @abstract
   */
  process() {}
  /** @abstract */
  processAfter() {}

  getContext(path) {
    const context = this.config.getContext();
    return path ? lodash.get(context, path) : context;
  }

  setContext(context, scope = this.namespace) {
    if (scope) {
      this.config.setContext({ [scope]: context });
      return;
    }

    return this.config.setContext(context);
  }

  dispatchTask(options) {
    const taskOpts = Object.assign({ context: this.getContext() }, options, {
      runType: this.config.isCI ? 'spinner' : 'prompt'
    });

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
