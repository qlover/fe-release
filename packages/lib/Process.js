import { Logger, Shell } from '@qlover/fe-node-lib';
import Config from './Config.js';
import { Container } from './Container.js';

export class Process {
  constructor(props) {
    this.container = new Container();

    this.setup(props);
  }

  setup(props) {
    this.container.register(Logger, new Logger());
    this.container.register(Shell, new Shell());
    this.container.register(Config, new Config(props));
  }

  /**
   * @returns {Logger}
   */
  get log() {
    return this.container.get(Logger);
  }

  /**
   * @returns {Shell}
   */
  get shell() {
    return this.container.get(Shell);
  }

  /**
   * @returns {Config}
   */
  get config() {
    return this.container.get(Config);
  }
}
