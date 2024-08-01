/* eslint-disable no-template-curly-in-string */
import PluginBase from '../PluginBase.js';
import TaskTypes from '../../config/TaskTypes.js';
import ContextFormat from '../utils/ContextFormat.js';

const GitCMD = {
  isRepo: 'git rev-parse --git-dir',
  branchName: 'git rev-parse --abbrev-ref HEAD',
  remoteByBranch: 'git config --get branch.${branch}.remote',
  getRemoteUrl: 'git remote get-url ${remoteNameOrUrl}',
  configGetRemotUrl: 'git config --get remote.${remoteNameOrUrl}.url',
  fetchRepo: 'git fetch',
  gitCommit: 'git commit'
};

const noStdout = { silent: false };

const commitMessage = 'Release ${releaseVersion}';
export default class Git extends PluginBase {
  constructor(args) {
    super({ namespace: 'Git', ...args });
  }

  /**
   * @override
   */
  getTaskList() {
    return {
      id: TaskTypes.GIT_COMMIT,
      type: 'confirm',
      message: (context) =>
        `Commit (${ContextFormat.truncateLines(ContextFormat.format(commitMessage, context), 1, ' [...]')})?`,
      default: true,
      run: () => this.commit()
    };
  }

  /**
   * @override
   */
  async init() {
    // if (!(await this.isGitRepo())) {
    //   throw new Error('not a git repo');
    // }

    const context = this.getContext();

    if (context.commit !== false) {
      await this.dispatchTask({ id: TaskTypes.GIT_COMMIT });
    }
  }

  async commit(message) {
    message = message || commitMessage;
    const msg = ContextFormat.format(message, this.getContext());
    const commitMessageArgs = msg ? ['--message', msg] : [];

    try {
      await this.exec(
        GitCMD.gitCommit.split(' ').concat(commitMessageArgs),
        noStdout
      );
    } catch (error) {
      if (
        /nothing (added )?to commit/.test(error) ||
        /nichts zu committen/.test(error)
      ) {
        this.log.warn(
          'No changes to commit. The latest commit will be tagged.'
        );
      } else {
        throw new Error(error);
      }
    }
  }
}
