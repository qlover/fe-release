import { Logger } from '@qlover/fe-node-lib';
import Prompts from '../Prompts.js';
import lodash from 'lodash';

/**
 * @private
 * @param {import('../Container.js').Container} container
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

export default class AbstractPlugin {
  /**
   * @param {object} props
   * @param {string} props.namespace
   * @param {import('../Container.js').Container} props.container
   */
  constructor({ namespace, container } = {}) {
    if (!namespace) {
      throw new Error('namespace is required!');
    }

    this.namespace = namespace;
    this.container = container;

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
    const context = lodash.merge({}, this.context);
    return path ? lodash.get(context, path) : this.context;
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
    options.namespace = this.namespace;
    return prompts.show(options);
  }

  /**
   * compose process task
   *
   * @param {object} options
   * @param {keyof<import('../../config/PromptsConst.js').default> | undefined} options.prompt
   */
  task(options) {
    const opts = Object.assign({}, options, { context: this.getContext() });
    return this.taskPrompt(opts);
  }
}
