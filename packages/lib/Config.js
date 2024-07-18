import lodash from 'lodash';

export default class Config {
  constructor() {
    this.context = {};
  }

  setContext(options) {
    lodash.merge(this.context, options);
  }
}
