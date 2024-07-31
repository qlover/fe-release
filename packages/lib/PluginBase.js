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

  getContext(path) {
    const context = lodash.merge({}, this.context);
    return path ? lodash.get(context, path) : this.context;
  }

  setContext(context) {
    lodash.merge(this.context, context);
  }

  dispatchTask(options) {
    const taskOpts = Object.assign({}, { context: this.getContext() }, options);
    return this.tasks.dispatch(taskOpts);
  }
}
