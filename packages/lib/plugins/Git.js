/* eslint-disable no-template-curly-in-string */
import PluginBase from '../PluginBase.js';
import { TasksAction } from '../../config/TasksConst.js';
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

export default class Git extends PluginBase {
  constructor(args) {
    super({ namespace: 'Git', ...args });
  }

  /**
   * @override
   */
  getTaskList() {
    return {
      id: TasksAction.GIT_COMMIT,
      type: 'confirm',
      message: (context) =>
        `Commit (${ContextFormat.truncateLines(ContextFormat.format(this.getContext('git.commitMessage'), context), 1, ' [...]')})?`,
      default: true,
      run: () => this.commit(this.getContext('git.commitMessage'))
    };
  }

  /**
   * @override
   */
  async init() {
    // if (!(await this.isGitRepo())) {
    //   throw new Error('not a git repo');
    // }
    this.log.debug('git init');
  }

  /**
   * @override
   */
  async process() {
    const context = this.getContext();

    if (context.git.commit !== false) {
      await this.dispatchTask({ id: TasksAction.GIT_COMMIT });
    }
  }

  async commit(message) {
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
