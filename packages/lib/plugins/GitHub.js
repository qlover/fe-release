import { TasksAction } from '../../config/TasksConst.js';
import PluginBase from '../PluginBase.js';
import Util from '../Util.js';
import { Octokit } from '@octokit/rest';
import fetch from 'node-fetch';

export default class Github extends PluginBase {
  constructor(args) {
    super({ namespace: 'GitHub', ...args });
    /** @type {Octokit | null} */
    this.octokit = null;
  }

  get client() {
    if (this.octokit) return this.octokit;
    const { timeout } = this.getContext();
    const host = this.context.host || this.getContext('repo.host');
    const isGitHub = host === 'github.com';
    const baseUrl = `https://${isGitHub ? 'api.github.com' : host}${isGitHub ? '' : '/api/v3'}`;

    this.octokit = new Octokit({
      baseUrl,
      auth: `token ${this.token}`,
      log: this.config.isDebug ? console : null,
      request: { timeout, fetch }
    });

    return this.octokit;
  }

  /**
   * @override
   */
  init() {
    this.debug('github init');
  }

  /**
   * @override
   */
  async process() {
    const { github } = this.getContext();

    if (github.release !== false) {
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

  release() {
    this.createRelease();
  }

  async createRelease() {
    const options = this.getOctokitReleaseOptions();
    // const { isDryRun } = this.config;

    // this.log.exec(
    //   `octokit repos.createRelease "${options.name}" (${options.tag_name})`,
    //   { isDryRun }
    // );

    // if (isDryRun) {
    //   this.setContext({
    //     isReleased: true,
    //     releaseUrl: this.getReleaseUrlFallback(options.tag_name)
    //   });
    //   return true;
    // }

    // return this.retry(async (bail) => {
    // try {
    this.debug(options);
    // const response = await this.client.repos.createRelease(options);
    // this.debug(response.data);
    // const { html_url, upload_url, id } = response.data;
    // this.setContext({
    //   isReleased: true,
    //   releaseId: id,
    //   releaseUrl: html_url,
    //   upload_url
    // });
    // this.config.setContext({
    //   isReleased: true,
    //   releaseId: id,
    //   releaseUrl: html_url,
    //   upload_url
    // });
    // this.log.verbose(
    //   `octokit repos.createRelease: done (${response.headers.location})`
    // );
    // return response.data;
    // } catch (err) {
    //   return this.handleError(err, bail);
    // }
    // });
  }

  getOctokitReleaseOptions(options = {}) {
    const context = this.getContext();
    const {
      releaseName,
      draft = false,
      preRelease = false,
      autoGenerate = false
    } = context;

    const { owner, project: repo } = context.repo;
    const { tagName } = this.config.getContext();
    const { version, releaseNotes, isUpdate } = this.getContext();
    const { isPreRelease } = Util.parseVersion(version);
    const name = Util.format(releaseName, this.config.getContext());
    const body = autoGenerate
      ? isUpdate
        ? null
        : ''
      : Util.truncateBody(releaseNotes);

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
