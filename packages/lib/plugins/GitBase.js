/* eslint-disable no-template-curly-in-string */
import { EOL } from 'node:os';
import Util from '../Util.js';
import PluginBase from '../PluginBase.js';

const noStdout = { silent: true };

export default class GitBase extends PluginBase {
  constructor(args) {
    super({ ...args, namespace: 'git' });
  }

  async init() {
    const remoteUrl = await this.getRemoteUrl();
    await this.fetch(remoteUrl);

    const branchName = await this.getBranchName();
    const repo = Util.parseGitUrl(remoteUrl);
    // TODO: Get a real last tagname, if has `RelesaeVersion`
    const latestTag = await this.getLatestTagName();

    this.setContext({ remoteUrl, branchName, repo, latestTag });
  }

  getLatestVersion() {
    const { latestTag } = this.getContext(this.namespace);
    return latestTag ? latestTag.replace(/^v/, '') : null;
  }

  isRemoteName(remoteUrlOrName) {
    return remoteUrlOrName && !remoteUrlOrName.includes('/');
  }

  async getRemoteUrl() {
    const remoteNameOrUrl =
      this.getContext('git.pushRepo') || (await this.getRemote()) || 'origin';
    return this.isRemoteName(remoteNameOrUrl)
      ? this.exec(`git remote get-url ${remoteNameOrUrl}`, noStdout).catch(() =>
          this.exec(
            `git config --get remote.${remoteNameOrUrl}.url`,
            noStdout
          ).catch(() => null)
        )
      : remoteNameOrUrl;
  }

  async getRemote() {
    const branchName = await this.getBranchName();
    return branchName ? await this.getRemoteForBranch(branchName) : null;
  }

  getBranchName() {
    return this.exec('git rev-parse --abbrev-ref HEAD', noStdout).catch(
      () => null
    );
  }

  getRemoteForBranch(branch) {
    return this.exec(
      `git config --get branch.${branch}.remote`,
      noStdout
    ).catch(() => null);
  }

  fetch(remoteUrl) {
    return this.exec('git fetch').catch((err) => {
      this.debug(err);
      throw new Error(`Unable to fetch from ${remoteUrl}${EOL}${err.message}`);
    });
  }

  getLatestTagName() {
    const context = this.getContext();

    const match = Util.format(
      context.tagMatch || context.tagName || '${latestVersion}',
      context
    );

    const exclude = context.tagExclude
      ? ` --exclude=${Util.format(context.tagExclude, context)}`
      : '';

    return this.exec(
      `git describe --tags --match=${match} --abbrev=0${exclude}`,
      noStdout
    ).then(
      (stdout) => stdout || null,
      () => null
    );
  }

  async getSecondLatestTagName(latestTag) {
    const sha = await this.exec(
      `git rev-list ${latestTag || '--skip=1'} --tags --max-count=1`,
      noStdout
    );
    return this.exec(
      `git describe --tags --abbrev=0 "${sha}^"`,
      noStdout
    ).catch(() => null);
  }
}
