import { TasksAction } from '../../config/TasksConst.js';
import PluginBase from '../PluginBase.js';
import Util from '../Util.js';

export default class Github extends PluginBase {
  constructor(args) {
    super({ namespace: 'GitHub', ...args });
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
    return Util.sleep(1000);
  }

  getOctokitReleaseOptions(options = {}) {
    const { owner, project: repo } = this.getContext('repo');
    const {
      releaseName,
      draft = false,
      preRelease = false,
      autoGenerate = false
    } = this.options;
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
