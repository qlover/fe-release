/* eslint-disable no-template-curly-in-string */
import PluginBase from '../PluginBase.js';
import { TasksAction } from '../../config/TasksConst.js';
import Util from '../Util.js';
import GitBase from './GitBase.js';

const CMD = {
  gitCommit: 'git commit',
  gitTags: 'git describe --tags',
  gitPush: 'git push --follow-tags',
  deleteLocalTags: 'git tag -d $(git tag -l)'
};
const cmds = (cmd, args = []) => cmd.split(' ').concat(args);
const invalidPushRepoRe = /^\S+@/;
const noStdout = { silent: true };

export default class Git extends PluginBase {
  constructor(args) {
    super({ namespace: 'git', ...args });
    /** @type {GitBase} */
    this.gitBase = args.container.get(GitBase);
  }

  /**
   * @override
   */
  getTaskList() {
    return [
      {
        id: TasksAction.GIT_COMMIT,
        type: 'confirm',
        message: (context) =>
          `Commit (${Util.truncateLines(Util.format(this.getContext('git.commitMessage'), context), 1, ' [...]')})?`,
        default: true,
        // not exec run methods if choose no, but prompt type alwarys exec
        run: () => this.commit(this.getContext('git.commitMessage'))
      },
      {
        id: TasksAction.GIT_TAG,
        type: 'confirm',
        message: (context) =>
          `Tag (${Util.format(context.git.tagName, context)})?`,
        run: () => this.tag(),
        default: true
      },
      {
        id: TasksAction.GIT_PUSH,
        type: 'confirm',
        message: () => 'Push?',
        run: () => this.push(),
        default: true
      }
    ];
  }

  /**
   * @override
   */
  async init() {
    // check release version
  }

  async processBefore() {
    if (!this.getContext('version.completed')) {
      this.setContext({ releaseVersion: this.config.latestVersion }, '');
    }
  }

  /**
   * @override
   */
  async process() {
    // task
    const { commit, tag, push } = this.getContext('git');
    if (commit !== false) {
      await this.dispatchTask({ id: TasksAction.GIT_COMMIT });
    }

    if (tag !== false) {
      await this.dispatchTask({ id: TasksAction.GIT_TAG });
    }

    if (push !== false) {
      await this.dispatchTask({ id: TasksAction.GIT_PUSH });
    }
  }

  async commit(message) {
    message = message || this.getContext('git.commitMessage');
    const msg = Util.format(message, this.getContext());
    const commitMessageArgs = msg ? ['--message', msg] : [];

    try {
      await this.exec(cmds(CMD.gitCommit, commitMessageArgs), noStdout);
      this.setContext({ isCommited: true });
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

  async tag({ tagName, annotation: tagAnnotation } = {}) {
    const context = this.getContext();
    tagName = tagName || context.tagName || context.releaseVersion;
    tagAnnotation = tagAnnotation || context.tagAnnotation;
    const message = Util.format(tagAnnotation, context);

    try {
      await this.exec([
        'git',
        'tag',
        '--annotate',
        '--message',
        message,
        tagName
      ]);
      this.setContext({ isTagged: true });
    } catch (err) {
      if (/tag '.+' already exists/.test(err)) {
        this.log.warn(`Tag "${tagName}" already exists`);
      } else {
        throw err;
      }
    }
  }

  async hasUpstreamBranch() {
    const ref = await this.exec('git symbolic-ref HEAD', noStdout);
    const branch = await this.exec(
      `git for-each-ref --format="%(upstream:short)" ${ref}`,
      noStdout
    ).catch(() => null);
    return Boolean(branch);
  }

  async getPushArgs(pushRepo) {
    if (pushRepo && !this.gitBase.isRemoteName(pushRepo)) {
      // Use (only) `pushRepo` if it's configured and looks like a url
      return [pushRepo];
    } else if (!(await this.hasUpstreamBranch())) {
      // Start tracking upstream branch (`pushRepo` is a name if set)
      return [
        '--set-upstream',
        pushRepo || 'origin',
        await this.gitBase.getBranchName()
      ];
    } else if (pushRepo && !invalidPushRepoRe.test(pushRepo)) {
      return [pushRepo];
    } else {
      return [];
    }
  }

  async push() {
    const pushArgs = await this.getPushArgs();
    const result = await this.exec(cmds(CMD.gitPush, pushArgs), noStdout);
    this.setContext({ isPushed: true });
    this.debug(result);
  }
}
