import semver from 'semver';
import AbstractPlugin from './AbstractPlugin.js';
import VersionConsts from '../../config/version.js';
export default class PluginVersion extends AbstractPlugin {
  constructor() {
    super({ domain: 'PluginVersion' });
  }

  getIncrement(options) {
    return options.increment;
  }

  getIncrementedVersionCI(options) {
    return this.incrementVersion(options);
  }

  async getIncrementedVersion(options) {
    const { isCI } = this.config;
    const version = this.incrementVersion(options);
    return (
      version || (isCI ? null : await this.promptIncrementVersion(options))
    );
  }

  promptIncrementVersion(options) {
    return new Promise((resolve) => {
      this.step({
        prompt: 'incrementList',
        task: (increment) =>
          increment
            ? resolve(
                this.incrementVersion(Object.assign({}, options, { increment }))
              )
            : this.step({ prompt: 'version', task: resolve })
      });
    });
  }

  isPreRelease(version) {
    return Boolean(semver.prerelease(version));
  }

  isValid(version) {
    return Boolean(semver.valid(version));
  }

  incrementVersion({
    latestVersion,
    increment,
    isPreRelease,
    preReleaseId,
    preReleaseBase
  }) {
    if (increment === false) return latestVersion;

    const latestIsPreRelease = this.isPreRelease(latestVersion);
    const isValidVersion = this.isValid(increment);

    if (latestVersion) {
      this.setContext({ latestIsPreRelease });
    }

    if (isValidVersion && semver.gte(increment, latestVersion)) {
      return increment;
    }

    if (isPreRelease && !increment && latestIsPreRelease) {
      return semver.inc(
        latestVersion,
        'prerelease',
        preReleaseId,
        preReleaseBase
      );
    }

    if (this.config.isCI && !increment) {
      if (isPreRelease) {
        return semver.inc(
          latestVersion,
          'prepatch',
          preReleaseId,
          preReleaseBase
        );
      } else {
        return semver.inc(latestVersion, 'patch');
      }
    }

    const normalizedType =
      VersionConsts.RELEASE_TYPES.includes(increment) && isPreRelease
        ? `pre${increment}`
        : increment;
    if (VersionConsts.ALL_RELEASE_TYPES.includes(normalizedType)) {
      return semver.inc(
        latestVersion,
        normalizedType,
        preReleaseId,
        preReleaseBase
      );
    }

    const coercedVersion = !isValidVersion && semver.coerce(increment);
    if (coercedVersion) {
      this.log.warn(
        `Coerced invalid semver version "${increment}" into "${coercedVersion}".`
      );
      return coercedVersion.toString();
    }
  }
}
