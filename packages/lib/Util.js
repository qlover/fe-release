import { EOL } from 'node:os';
import lodash from 'lodash';
import semver from 'semver';
import gitUrlParse from 'git-url-parse';

const log = console;

export default class Util {
  /**
   * 用于格式化字符串
   *
   * @example
   * format("git commit -m '${message}'", { message: 'first commit' })
   * // git commit -m 'first commit'
   * @param {*} template
   * @param {*} context
   * @returns
   */
  static format(template = '', context = {}) {
    try {
      return lodash.template(template)(context);
    } catch (error) {
      log.error(
        `Unable to render template with context:\n${template}\n${JSON.stringify(context)}`
      );
      log.error(error);
      throw error;
    }
  }

  static truncateLines(input, maxLines = 10, surplusText = null) {
    const lines = input.split(EOL);
    const surplus = lines.length - maxLines;
    const output = lines.slice(0, maxLines).join(EOL);
    return surplus > 0
      ? surplusText
        ? `${output}${surplusText}`
        : `${output}${EOL}...and ${surplus} more`
      : output;
  }

  static sleep(ms = 16) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  static parseVersion(raw) {
    if (raw == null)
      return { version: raw, isPreRelease: false, preReleaseId: null };
    const version = semver.valid(raw) ? raw : semver.coerce(raw);
    if (!version)
      return { version: raw, isPreRelease: false, preReleaseId: null };
    const parsed = semver.parse(version);
    const isPreRelease = parsed.prerelease.length > 0;
    const preReleaseId =
      isPreRelease && isNaN(parsed.prerelease[0]) ? parsed.prerelease[0] : null;
    return {
      version: version.toString(),
      isPreRelease,
      preReleaseId
    };
  }

  static truncateBody(body) {
    if (body && body.length >= 124000) return body.substring(0, 124000) + '...';
    return body;
  }

  /**
   * parse git remote url info.
   * @param {string} remoteUrl
   * @returns
   */
  static parseGitUrl(remoteUrl) {
    if (!remoteUrl)
      return {
        host: null,
        owner: null,
        project: null,
        protocol: null,
        remote: null,
        repository: null
      };
    const normalizedUrl = (remoteUrl || '')
      .replace(/^[A-Z]:\\\\/, 'file://') // Assume file protocol for Windows drive letters
      .replace(/^\//, 'file://') // Assume file protocol if only /path is given
      .replace(/\\+/g, '/'); // Replace forward with backslashes
    const parsedUrl = gitUrlParse(normalizedUrl);
    const { resource: host, name: project, protocol, href: remote } = parsedUrl;
    const owner =
      protocol === 'file'
        ? lodash.last(parsedUrl.owner.split('/'))
        : parsedUrl.owner; // Fix owner for file protocol
    const repository = `${owner}/${project}`;
    return { host, owner, project, protocol, remote, repository };
  }
}
