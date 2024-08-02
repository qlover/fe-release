import PluginBase from '../PluginBase.js';

export default class Github extends PluginBase {
  constructor(args) {
    super({ namespace: 'GitHub', ...args });
  }

  init() {
    this.debug('github init');
  }

  async process() {
    this.debug(this.getContext(), this.context);
  }
}
