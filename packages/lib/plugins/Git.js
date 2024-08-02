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
  gitCommit: 'git commit',
  gitTags: 'git describe --tags',
  deleteLocalTags: 'git tag -d $(git tag -l)'
};

const noStdout = { silent: true };

export default class Git extends PluginBase {
  constructor(args) {
    super({ namespace: 'Git', ...args });
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
          `Commit (${ContextFormat.truncateLines(ContextFormat.format(this.getContext('git.commitMessage'), context), 1, ' [...]')})?`,
        default: true,
        // not exec run methods if choose no, but prompt type alwarys exec
        run: () => this.commit(this.getContext('git.commitMessage'))
      },
      {
        id: TasksAction.GIT_TAG,
        type: 'confirm',
        message: (context) =>
          `Tag (${ContextFormat.format(context.tagTemplate, context)})?`,
        run: () => this.tag(),
        default: true
      },
      {
        id: TasksAction.GIT_PUSH,
        type: 'confirm',
        message: () => 'Push?',
        default: true
      }
    ];
  }

  /**
   * @override
   */
  async init() {
    // if (!(await this.isGitRepo())) {
    //   throw new Error('not a git repo');
    // }

    const { git, releaseVersion } = this.getContext();

    const latestTag = (await this.getLatestTagName()) || releaseVersion;
    const tagTemplate =
      git.tagName ||
      ((latestTag || '').match(/^v/)
        ? 'v${releaseVersion}'
        : '${releaseVersion}');

    this.config.setContext({ latestTag, tagTemplate });
  }

  /**
   * @override
   */
  async process() {
    const { commit, tag } = this.getContext('git');

    if (commit !== false) {
      await this.dispatchTask({ id: TasksAction.GIT_COMMIT });
    }

    if (tag !== false) {
      await this.dispatchTask({ id: TasksAction.GIT_TAG });
    }
  }

  getLatestTagName() {
    const context = this.getContext();

    const match = ContextFormat.format(
      context.tagMatch || context.tagName || '${releaseVersion}',
      context
    );

    const exclude = context.tagExclude
      ? ` --exclude=${ContextFormat.format(context.tagExclude, context)}`
      : '';

    return this.exec(
      `${GitCMD.gitTags} --match=${match} --abbrev=0${exclude}`,
      noStdout
    ).then(
      (stdout) => stdout || null,
      () => null
    );
  }

  async commit(message) {
    message = message || this.getContext('git.commitMessage');
    const msg = ContextFormat.format(message, this.getContext());
    const commitMessageArgs = msg ? ['--message', msg] : [];

    try {
      await this.exec(
        GitCMD.gitCommit.split(' ').concat(commitMessageArgs),
        noStdout
      );
      this.setContext({ commited: true });
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

  tag({ tagName, annotation: tagAnnotation } = {}) {
    const context = this.getContext();
    tagName = tagName || context.tagName || context.releaseVersion;
    tagAnnotation = tagAnnotation || context.tagAnnotation;
    this.log.debug(tagName, tagAnnotation);
    const message = ContextFormat.format(tagAnnotation, context);
    return this.exec([
      'git',
      'tag',
      '--annotate',
      '--message',
      message,
      tagName
    ])
      .then(() => this.setContext({ isTagged: true }))
      .catch((err) => {
        if (/tag '.+' already exists/.test(err)) {
          this.log.warn(`Tag "${tagName}" already exists`);
        } else {
          throw err;
        }
      });
  }
}
