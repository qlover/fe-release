import lodash from 'lodash';
import { Loader } from './Loader.js';
import isCI from 'is-ci';
import { Files } from '@qlover/fe-node-lib';
import { ConfigExts } from '../config/TasksConst.js';

const pkg = Loader.loadPackageJSON();
const defaultFeConfig = Files.readJSON(
  new URL('../config/fe-release.json', import.meta.url)
);

function getConfigSearch(moduleName) {
  return ['package.json'].concat(
    ConfigExts.map((ext) => `.${moduleName}${ext}`),
    ConfigExts.map((ext) => `${moduleName}${ext}`)
  );
}

function getInitOptions(options, context, loaders = {}) {
  const moduleName = options.moduleName || 'fe-release';
  const searchPlaces = getConfigSearch(moduleName);
  const searchConfig = Loader.searchFeReleaseConfig({
    dir: options.dir,
    file: options.file,
    moduleName,
    searchPlaces,
    loaders
  });
  return lodash.defaultsDeep(
    {},
    options,
    context,
    searchConfig,
    defaultFeConfig
  );
}

/**
 * @private
 */
export default class Config {
  constructor({ context, config = {} }) {
    this.context = lodash.merge(
      {
        ci: isCI,
        latestVersion: this.latestVersion
      },
      context
    );
    this.options = getInitOptions(config, this.context);
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
