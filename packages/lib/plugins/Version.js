import semver from 'semver';
import PluginBase from '../PluginBase.js';
import { TasksAction, TasksTypes } from '../../config/TasksConst.js';
import chalk from 'chalk';
import Config from '../Config.js';
import lodash from 'lodash';

const { green, red, redBright } = chalk;

const RELEASE_TYPES = ['patch', 'minor', 'major'];
const PRERELEASE_TYPES = ['prepatch', 'preminor', 'premajor'];
const CONTINUATION_TYPES = ['prerelease', 'pre'];
const CHOICES = {
  latestIsPreRelease: [CONTINUATION_TYPES[0], ...RELEASE_TYPES],
  preRelease: PRERELEASE_TYPES,
  default: [...RELEASE_TYPES, ...PRERELEASE_TYPES]
};

class VersionTaskUtil {
  static getIncrementChoices(context) {
    const { latestIsPreRelease, isPreRelease, preReleaseId, preReleaseBase } =
      context.version;
    const types = latestIsPreRelease
      ? CHOICES.latestIsPreRelease
      : isPreRelease
        ? CHOICES.preRelease
        : CHOICES.default;
    const choices = types.map((increment) => ({
      name: `${increment} (${semver.inc(context.latestVersion, increment, preReleaseId, preReleaseBase)})`,
      value: increment
    }));
    const otherChoice = {
      name: 'Other, please specify...',
      value: ''
    };

    return [...choices, otherChoice];
  }

  static versionTransformer(context) {
    return (input) =>
      semver.valid(input)
        ? semver.gt(input, context.latestVersion)
          ? green(input)
          : red(input)
        : redBright(input);
  }

  static getTaskList() {
    return [
      {
        id: TasksAction.INCREMENT_LIST,
        type: 'list',
        message: () => 'Select increment (next version):',
        choices: (context) => VersionTaskUtil.getIncrementChoices(context),
        pageSize: 9
      },
      {
        id: TasksAction.VERSION,
        type: 'input',
        message: () => `Please enter a valid version:`,
        transformer: (context) => VersionTaskUtil.versionTransformer(context),
        validate: (input) =>
          !!semver.valid(input) ||
          'The version must follow the semver standard.'
      }
    ];
  }
}

export default class Version extends PluginBase {
  constructor(args) {
    super({ namespace: 'Version', ...args });
  }

  /**
   * @override
   * @returns {import('@qlover/fe-release').TaskInterface[] | import('@qlover/fe-release').TaskInterface}
   */
  getTaskList() {
    return VersionTaskUtil.getTaskList();
  }

  /**
   * @override
   */
  async init() {
    /** @type {Config} */
    const config = this.container.get(Config);
    const context = config.getContext();

    const newContext = this.expandPreReleaseShorthand(context);
    // extends default version
    config.setContext(newContext);
    this.setContext(newContext);
  }

  /**
   * @override
   */
  async process() {
    await this.triggerIncrementVersion();
  }

  async incrementTask({ type, value: increment }) {
    /** @type {Config} */
    const config = this.container.get(Config);
    const context = config.getContext();

    // spinner auto inc version
    if (type === TasksTypes.AUTO) {
      // await Thread.sleep(1000);
      const newVersion = this.incrementVersion(context);
      config.setContext({ releaseVersion: newVersion });
      return;
    }

    if (increment) {
      const newVersion = this.incrementVersion({ ...context, increment });
      config.setContext({ releaseVersion: newVersion });
      return;
    }

    return this.dispatchTask({
      id: TasksAction.VERSION,
      run: (args) => {
        config.setContext({ releaseVersion: args.value });
      }
    });
  }

  async triggerIncrementVersion() {
    /** @type {Config} */
    const config = this.container.get(Config);
    const context = config.getContext();

    if (context.increment === false) {
      config.setContext({ releaseVersion: context.latestVersion });
      return;
    }

    if (context.increment && lodash.isString(context.increment)) {
      // increment task
      const newVersion = await this.incrementVersion(context);
      // updatea version
      config.setContext({ releaseVersion: newVersion });
      return;
    }

    return this.dispatchTask({
      id: TasksAction.INCREMENT_LIST,
      run: this.incrementTask.bind(this)
    });
  }

  /**
   *
   * @param {object} param0
   * @param {string} param0.latestVersion
   * @param {semver.ReleaseType | false} param0.increment default is 'patch'
   * @returns
   */
  incrementVersion({ latestVersion, increment }) {
    if (increment === false) {
      return latestVersion;
    }

    return semver.inc(latestVersion, increment || 'patch');
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
}
