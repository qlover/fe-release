import lodash from 'lodash';
import { Loader } from './Loader.js';

const pkg = Loader.loadPackageJSON();
export default class Config {
  constructor(props) {
    this.props = props;

    this.options = lodash.merge({}, props.argv, {
      latestVersion: this.latestVersion
    });
    this.options = this.expandPreReleaseShorthand(this.options);

    this.context = lodash.merge({}, props.argv, {
      latestVersion: this.latestVersion
    });
  }

  setContext(options) {
    lodash.merge(this.context, options);
  }

  getContext(path) {
    const context = lodash.merge({}, this.options, this.context);
    return path ? lodash.get(context, path) : context;
  }

  expandPreReleaseShorthand(options) {
    const { increment, preRelease, preReleaseId, snapshot, preReleaseBase } =
      options;
    const isPreRelease = Boolean(preRelease) || Boolean(snapshot);
    const inc = snapshot ? 'prerelease' : increment;
    const preId =
      typeof preRelease === 'string'
        ? preRelease
        : typeof snapshot === 'string'
          ? snapshot
          : preReleaseId;
    options.version = {
      increment: inc,
      isPreRelease,
      preReleaseId: preId,
      preReleaseBase
    };
    if (typeof snapshot === 'string' && options.git) {
      // Pre set and hard code some options
      options.git.tagMatch = `0.0.0-${snapshot}.[0-9]*`;
      options.git.getLatestTagFromAllRefs = true;
      options.git.requireBranch = '!main';
      options.git.requireUpstream = false;
      options.npm.ignoreVersion = true;
    }
    return options;
  }

  get latestVersion() {
    return pkg.version || '0.0.0';
  }
}
