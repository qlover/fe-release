import { TasksAction } from '../../config/TasksConst.js';
import PluginBase from '../PluginBase.js';
import Util from '../Util.js';
import { Octokit } from '@octokit/rest';
import fetch from 'node-fetch';
import GitBase from './GitBase.js';
import { Env } from '@qlover/fe-node-lib';

export default class Github extends PluginBase {
  constructor(args) {
    super({ namespace: 'GitHub', ...args });
    /** @type {Octokit | null} */
    this.octokit = null;
    /** @type {GitBase} */
    this.gitBase = args.container.get(GitBase);
  }

  get client() {
    if (this.octokit) return this.octokit;
    const { timeout } = this.getContext();
    const host = this.context.host || this.getContext('repo.host');
    const isGitHub = host === 'github.com';
    const baseUrl = `https://${isGitHub ? 'api.github.com' : host}${isGitHub ? '' : '/api/v3'}`;

    this.octokit = new Octokit({
      baseUrl,
      auth: this.token,
      log: this.config.isDebug ? console : null,
      request: { timeout, fetch }
    });

    return this.octokit;
  }

  /**
   * @override
   */
  init() {
    const tokenRef = this.getContext('github.tokenRef');
    this.token = Env.get(tokenRef, 1);

    if (!this.token) {
      this.log.warn(
        `Environment variable "${tokenRef}" is required for automated GitHub Releases.`
      );
    }

    this.log.log(this.token);
  }

  /**
   * @override
   */
  async process() {
    const { release } = this.getContext('github');

    if (release !== false) {
      await this.dispatchTask({ id: TasksAction.GITHUB_RELEASE });
    }
  }

  /**
   * @override
   */
  getTaskList() {
    return {
      id: TasksAction.GITHUB_RELEASE,
      type: 'confirm',
      message: (context) => {
        const { github } = context;
        const { releaseName } = github;
        const name = Util.format(releaseName, context);
        return `Create a release on GitHub (${name})?`;
      },
      default: true,
      run: () => this.release()
    };
  }

  async release() {
    await this.createRelease();
  }

  async createRelease() {
    const options = this.getOctokitReleaseOptions();

    this.debug(options);

    const response = await this.client.repos.createRelease(options);

    this.debug(response.data);

    const { html_url: htmlUrl, upload_url: uploadUrl, id } = response.data;
    this.setContext({
      isReleased: true,
      releaseId: id,
      releaseUrl: htmlUrl,
      upload_url: uploadUrl
    });
    // this.config.setContext({
    //   isReleased: true,
    //   releaseId: id,
    //   releaseUrl: html_url,
    //   upload_url
    // });
    this.log.verbose(
      `octokit repos.createRelease: done (${response.headers.location})`
    );
  }

  getOctokitReleaseOptions(options = {}) {
    const context = this.getContext();
    const { git, github, version } = context;
    const {
      releaseName,
      releaseDescribe,
      draft = false,
      preRelease = false,
      autoGenerate = false
    } = github;

    const { owner, project: repo } = context.repo;
    const { isPreRelease } = Util.parseVersion(version);
    const name = Util.format(releaseName, context);
    const tagName = Util.format(git.tagName, context);
    const body = autoGenerate ? '' : Util.truncateBody(releaseDescribe);

    return Object.assign(options, {
      owner,
      repo,
      tag_name: tagName,
      name,
      body,
      draft,
      prerelease: isPreRelease || preRelease,
      generate_release_notes: autoGenerate
    });
  }
}
