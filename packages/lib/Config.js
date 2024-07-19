import lodash from 'lodash';
import { Loader } from './Loader.js';

const pkg = Loader.loadPackageJSON();
export default class Config {
  constructor(props) {
    this.props = props;
    this.context = lodash.merge(
      {},
      {
        latestVersion: this.latestVersion,
        ...props.argv
      }
    );
  }

  setContext(options) {
    lodash.merge(this.context, options);
  }

  getContext(path) {
    return path ? lodash.get(this.context, path) : this.context;
  }

  get latestVersion() {
    return pkg.version || '0.0.0';
  }
}
