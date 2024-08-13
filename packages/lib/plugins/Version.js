import semver from 'semver';
import PluginBase from '../PluginBase.js';
import { TasksAction, TasksTypes } from '../../config/TasksConst.js';
import chalk from 'chalk';
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
const DEFAULT_RELEASE_TYPE = RELEASE_TYPES[0];

class VersionTaskUtil {
  static getIncrementChoices(context) {
    const { latestIsPreRelease, isPreRelease, preReleaseId, preReleaseBase } =
      context;
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
    super({ namespace: 'version', ...args });
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
    const context = this.getContext();
    const newContext = this.expandPreReleaseShorthand(context);

    this.setContext(newContext);
  }

  /**
   * @override
   */
  async process() {
    await this.triggerIncrementVersion();
  }

  setReleaseVersion(version) {
    this.setContext({ releaseVersion: version, completed: true });
    this.setContext({ releaseVersion: version }, null);
  }

  async incrementTask({ type, value: increment }) {
    const context = this.getContext();

    // spinner auto inc version
    if (type === TasksTypes.AUTO) {
      // await Thread.sleep(1000);
      const newVersion = this.incrementVersion(context);
      this.setReleaseVersion(newVersion);
      return;
    }

    if (increment) {
      const newVersion = this.incrementVersion({ ...context, increment });
      this.setReleaseVersion(newVersion);
      return;
    }

    return this.dispatchTask({
      id: TasksAction.VERSION,
      run: (args) => this.setReleaseVersion(args.value)
    });
  }

  async triggerIncrementVersion() {
    const context = this.getContext();

    if (context.increment === false) {
      this.setReleaseVersion(context.latestVersion);
      return;
    }

    if (context.increment && lodash.isString(context.increment)) {
      // increment task
      const newVersion = await this.incrementVersion(context);
      // updatea version
      this.setReleaseVersion(newVersion);
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

    return semver.inc(latestVersion, increment || DEFAULT_RELEASE_TYPE);
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
    return {
      increment: inc,
      isPreRelease,
      preReleaseId: preId,
      preReleaseBase
    };
  }
}
