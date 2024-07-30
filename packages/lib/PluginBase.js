import { Logger, Shell } from '@qlover/fe-node-lib';
import Prompts from './Prompts.js';
import Spinner from './Spinner.js';
import Config from './Config.js';
import lodash from 'lodash';

/**
 * @private
 * @param {import('./Container.js').Container} container
 * @param {object} param1
 * @param {Prompts} param1.prompt
 * @param {string} param1.namespace
 */
function setup(container, { namespace, prompt }) {
  if (lodash.isPlainObject(prompt) && !lodash.isEmpty(prompt)) {
    /** @type {Prompts} */
    const prompts = container.get(Prompts);
    prompts.register(prompt, namespace);
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

    /**
     * only every plugin context
     */
    this.context = {};

    setup(container, { namespace, prompt: this.getPrompt() });
  }

  /**
   * get a prompt task object.
   * @abstract
   */
  getPrompt() {}

  getContext(path) {
    const context = lodash.merge({}, this.config.getContext(), this.context);
    return path ? lodash.get(context, path) : context;
  }

  setContext(context) {
    lodash.merge(this.context, context);
  }

  /**
   * plugin init logic
   * @abstract
   */
  init() {
    this.container.get(Logger).warn(`${this.namespace} init not implements`);
  }

  /**
   * only `prompt` task
   *
   * @private
   * @param {object} options
   * @returns
   */
  async taskPrompt(options) {
    /** @type {Prompts} */
    const prompts = this.container.get(Prompts);

    if (!prompts.get(options.type, this.namespace)) {
      this.log.warn(`Prompt Task ${options.type} not found!`);
      return;
    }

    options.namespace = this.namespace;
    return prompts.show(options);
  }

  /**
   * compose process task
   *
   * @param {object} options
   * @param {keyof<import('../config/TaskTypes.js').default> | undefined} options.type task type and also prompt type
   * @param {() => void | Promise<any>} options.task
   * @param {string} options.label spinner show label template string
   */
  task(options) {
    /** @type {Config} */
    const config = this.container.get(Config);
    const opts = Object.assign({}, options, { context: this.getContext() });

    // spinner
    if (config.isCI) {
      /** @type {Spinner} */
      const spinner = this.container.get(Spinner);
      opts.label = opts.label || opts.type;
      return spinner.show(opts);
    }

    return this.taskPrompt(opts);
  }

  /**
   * run command
   * @param {string | string[]} command
   * @param {Record<string, any>} options
   * @param {Record<string, any>} context
   * @returns
   */
  exec(command, options, context) {
    const ctx = Object.assign(context || {}, this.getContext());
    return this.shell.exec(command, options, ctx);
  }
}
