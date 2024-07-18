import { Container } from '../Container.js';
import AbstractPlugin from './AbstractPlugin.js';

export default class PluginVersion extends AbstractPlugin {
  constructor() {
    super({ domain: 'PluginVersion' });
  }

  init() {
    Container.log.log('pluginversion init');
  }
}
