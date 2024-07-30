import lodash from 'lodash';
import { Loader } from './Loader.js';
import isCI from 'is-ci';
const pkg = Loader.loadPackageJSON();

/**
 * @private
 */
export default class Config {
  constructor({ context }) {
    this.context = lodash.merge(
      {
        ci: isCI,
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

  get isCI() {
    return !!this.context.ci;
  }
}
