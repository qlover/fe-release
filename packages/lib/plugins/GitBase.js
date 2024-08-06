/* eslint-disable no-template-curly-in-string */
import { EOL } from 'node:os';
import Util from '../Util.js';
import PluginBase from '../PluginBase.js';

const noStdout = { silent: true };
const changelogFallback = 'git log --pretty=format:"* %s (%h)"';

export default class GitBase extends PluginBase {
  constructor(args) {
    super({ namespace: 'GitBase', ...args });
  }

  async init() {
    const remoteUrl = await this.getRemoteUrl();
    await this.fetch(remoteUrl);

    const branchName = await this.getBranchName();
    const repo = Util.parseGitUrl(remoteUrl);
    this.setContext({ remoteUrl, branchName, repo });
    this.config.setContext({ remoteUrl, branchName, repo });

    const { git, releaseVersion } = this.getContext();
    const latestTag = (await this.getLatestTagName()) || releaseVersion;
    const tagTemplate =
      git.tagName ||
      ((latestTag || '').match(/^v/)
        ? 'v${releaseVersion}'
        : '${releaseVersion}');

    this.config.setContext({ latestTag, tagTemplate });
  }

  getName() {
    return this.getContext('repo.project');
  }

  getLatestVersion() {
    const { tagTemplate, latestTag } = this.config.getContext();
    const prefix = tagTemplate.replace(/\$\{version\}/, '');
    return latestTag ? latestTag.replace(prefix, '').replace(/^v/, '') : null;
  }

  async getChangelog() {
    const { snapshot } = this.config.getContext();
    const { latestTag, secondLatestTag } = this.config.getContext();
    const context = { latestTag, from: latestTag, to: 'HEAD' };
    const { changelog } = this.options;
    if (!changelog) return null;

    if (latestTag && !this.config.isIncrement) {
      context.from = secondLatestTag;
      context.to = `${latestTag}^1`;
    }

    // For now, snapshots do not get a changelog, as it often goes haywire (easy to add to release manually)
    if (snapshot) return '';

    if (!context.from && changelog.includes('${from}')) {
      return this.exec(changelogFallback);
    }

    return this.exec(changelog, noStdout, context);
  }

  bump(version) {
    const { tagTemplate } = this.config.getContext();
    const context = Object.assign(this.config.getContext(), { version });
    const tagName = Util.format(tagTemplate, context) || version;
    this.setContext({ version });
    this.config.setContext({ tagName });
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
