import PluginBase from '../PluginBase.js';

export default class Github extends PluginBase {
  constructor(args) {
    super({ namespace: 'GitHub', ...args });
  }

  init() {
    this.log.debug('github init');
  }
}
