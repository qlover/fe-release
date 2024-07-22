import { Container } from '../Container.js';
import Prompts from '../prompts/Prompts.js';
import lodash from 'lodash';

export default class AbstractPlugin {
  /**
   * @param {object} props
   * @param {string} props.domain
   * @param {import('../Process.js').Process} props.process
   */
  constructor(props = {}) {
    if (!props.domain) {
      throw new Error('Domain is required!');
    }

    /**
     * @type {Prompts}
     */
    this.prompts = Container.get(Prompts);
    this.domain = props.domain;
    this.process = props.process;

    // register prompt
    const prompts = this.getPrompts();
    if (lodash.isPlainObject(prompts) && !lodash.isEmpty(prompts)) {
      this.prompts.register(prompts, this.domain);
    }
  }

  getPrompts() {}

  /**
   * @returns {import('../Config.js').default}
   */
  get config() {
    return this.process.config;
  }

  init() {}

  getContext(path) {
    const context = lodash.merge({}, this.options, this.context);
    return path ? lodash.get(context, path) : context;
  }

  setContext(context) {
    lodash.merge(this.context, context);
  }

  async showPrompt(options) {
    options.namespace = this.domain;
    return this.prompts.show(options);
  }

  /**
   * switch `inquirer` task
   *
   * @param {object} options
   * @param {keyof<import('../prompts/PromptsConst.js').default> | undefined} options.prompt
   */
  task(options) {
    const context = Object.assign({}, this.config.getContext(), {
      [this.domain]: this.getContext()
    });
    const opts = Object.assign({}, options, { context });

    return this.config.isCI ? this.spinner.show(opts) : this.showPrompt(opts);
  }
}
