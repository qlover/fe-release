import lodash from 'lodash';
import { Loader } from './Loader.js';

const pkg = Loader.loadPackageJSON();

/**
 * @private
 */
export default class Config {
  constructor({ context }) {
    this.context = lodash.merge(
      {
        latestVersion: this.latestVersion
      },
      context
    );
  }

  setContext(options) {
    lodash.merge(this.context, options);
  }

  getContext(path) {
    const context = lodash.merge({}, this.options, this.context);
    return path ? lodash.get(context, path) : context;
  }

  get latestVersion() {
    return pkg.version || '0.0.0';
  }
}
