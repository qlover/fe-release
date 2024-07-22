import semver from 'semver';
import AbstractPlugin from './AbstractPlugin.js';
import PromptsConst from '../prompts/PromptsConst.js';
import chalk from 'chalk';

const { green, red, redBright } = chalk;
const RELEASE_TYPES = ['patch', 'minor', 'major'];
const PRERELEASE_TYPES = ['prepatch', 'preminor', 'premajor'];
const CONTINUATION_TYPES = ['prerelease', 'pre'];

const VersionPrompt = {
  CHOICES: {
    latestIsPreRelease: [CONTINUATION_TYPES[0], ...RELEASE_TYPES],
    preRelease: PRERELEASE_TYPES,
    default: [...RELEASE_TYPES, ...PRERELEASE_TYPES]
  },

  getIncrementChoices: (context) => {
    const { latestIsPreRelease, isPreRelease, preReleaseId, preReleaseBase } =
      context.version;
    const types = latestIsPreRelease
      ? VersionPrompt.CHOICES.latestIsPreRelease
      : isPreRelease
        ? VersionPrompt.CHOICES.preRelease
        : VersionPrompt.CHOICES.default;
    const choices = types.map((increment) => ({
      name: `${increment} (${semver.inc(context.latestVersion, increment, preReleaseId, preReleaseBase)})`,
      value: increment
    }));
    const otherChoice = {
      name: 'Other, please specify...',
      value: ''
    };

    return [...choices, otherChoice];
  },

  versionTransformer: (context) => (input) =>
    semver.valid(input)
      ? semver.gt(input, context.latestVersion)
        ? green(input)
        : red(input)
      : redBright(input),

  prompt: {
    [PromptsConst.INCREMENT_LIST]: {
      type: 'list',
      message: () => 'Select increment (next version):',
      choices: (context) => VersionPrompt.getIncrementChoices(context),
      pageSize: 9
    },
    [PromptsConst.VERSION]: {
      type: 'input',
      message: () => `Please enter a valid version:`,
      transformer: (context) => VersionPrompt.versionTransformer(context),
      validate: (input) =>
        !!semver.valid(input) || 'The version must follow the semver standard.'
    }
  }
};

export default class PluginVersion extends AbstractPlugin {
  constructor(args) {
    super({ ...args });
  }

  /**
   * @override
   */
  async init() {
    const context = this.config.getContext();

    const newVersion = await this.getIncrementedVersion({
      latestVersion: context.latestVersion,
      increment: context.increment
    });

    this.config.setContext({ releaseVersion: newVersion });
  }

  /**
   * @override
   * @returns
   */
  getPrompts() {
    return VersionPrompt.prompt;
  }

  async getIncrementedVersion(options) {
    return await this.promptIncrementVersion(options);
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

  promptIncrementVersion(options) {
    return new Promise((resolve) => {
      this.task({
        prompt: PromptsConst.INCREMENT_LIST,
        task: (increment) =>
          increment
            ? resolve(this.incrementVersion({ ...options, increment }))
            : this.task({ prompt: PromptsConst.VERSION, task: resolve })
      });
    });
  }
}
