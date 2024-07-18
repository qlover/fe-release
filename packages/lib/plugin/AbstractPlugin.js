import { Container } from '../Container.js';

export default class AbstractPlugin {
  constructor({ domain }) {
    if (!domain) {
      throw new Error('Domain is required!');
    }

    this.domain = domain;
    this.log = Container.log;
    this.shell = Container.shell;
  }

  init() {}
}
