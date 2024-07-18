import semver from 'semver';
import AbstractPlugin from './AbstractPlugin.js';
import { Files } from '@qlover/fe-node-lib';
import { resolve } from 'path';
export default class PluginVersion extends AbstractPlugin {
  constructor(args) {
    super({ ...args });
  }

  init() {
    const newVersion = this.incrementVersion({
      latestVersion: this.getLatestVersion()
    });

    this.process.config.setContext({ version: newVersion });
  }

  getLatestVersion() {
    const pkg = Files.readJSON(resolve('./package.json'));
    return pkg.version;
  }

  incrementVersion({ latestVersion }) {
    return semver.inc(latestVersion, 'patch');
  }
}
