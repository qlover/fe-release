import semver from 'semver';
import AbstractPlugin from './AbstractPlugin.js';

export default class PluginVersion extends AbstractPlugin {
  constructor(args) {
    super({ ...args });
  }

  init() {
    const context = this.config.getContext();

    const newVersion = this.incrementVersion({
      latestVersion: context.latestVersion,
      increment: context.increment
    });

    this.config.setContext({ version: newVersion });
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
}
