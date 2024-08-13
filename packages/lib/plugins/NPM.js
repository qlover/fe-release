import { TasksAction } from '../../config/TasksConst.js';
import { Loader } from '../Loader.js';
import PluginBase from '../PluginBase.js';
import urlJoin from 'url-join';

const noStdout = { silent: true };
const DEFAULT_TAG = 'latest';
const NPM_BASE_URL = 'https://www.npmjs.com';
const NPM_PUBLIC_PATH = '/package';

export default class NPM extends PluginBase {
  constructor(args) {
    super({ ...args });
  }

  /**
   * @override
   */
  getTaskList() {
    return [
      {
        id: TasksAction.NPM_PUBLISH,
        type: 'confirm',
        message: (context) =>
          `Publish ${context.npm.name}${context.npm.tag === 'latest' ? '' : `@${context.npm.tag || context.latestVersion}`} to npm?`,
        default: true,
        run: () => this.publish()
      },
      {
        id: TasksAction.NPM_OTP,
        type: 'input',
        message: () => `Please enter OTP for npm:`,
        run: ({ value }) => this.setContext({ otp: value })
      }
    ];
  }

  /**
   * @override
   */
  async init() {
    const pkg = Loader.loadPackageJSON();
    const { name, latestVersion, private: isPrivate, publishConfig } = pkg;
    this.setContext({ name, latestVersion, private: isPrivate, publishConfig });

    await this.validations();
  }

  async validations(timeout) {
    // const validations = Promise.all([
    //   this.isRegistryUp(),
    //   this.isAuthenticated()
    // ]);

    // await Promise.race([
    //   validations,
    //   Util.fetchTimeout(timeout, new Error(`Timed out after ${timeout}ms.`))
    // ]);

    // const [isRegistryUp, isAuthenticated] = await validations;

    // if (!isRegistryUp) {
    //   throw new Error(
    //     `Unable to reach npm registry (timed out after ${timeout}ms).`
    //   );
    // }

    if (!(await this.isAuthenticated())) {
      throw new Error(
        'Not authenticated with npm. Please `npm login` and try again.'
      );
    }
  }

  isRegistryUp() {
    const registry = this.getRegistry();
    const registryArg = registry ? ` --registry ${registry}` : '';
    return this.exec(`npm ping${registryArg}`, noStdout).then(
      () => true,
      (err) => {
        if (
          /code E40[04]|404.*(ping not found|No content for path)/.test(err)
        ) {
          this.log.warn(
            'Ignoring response from unsupported `npm ping` command.'
          );
          return true;
        }
        return false;
      }
    );
  }

  isAuthenticated() {
    const registry = this.getRegistry();
    const registryArg = registry ? ` --registry ${registry}` : '';
    const command = `npm whoami${registryArg}`;
    return this.exec(command, noStdout).then(
      (output) => {
        const username = output ? output.trim() : null;
        this.setContext({ username });
        return true;
      },
      (err) => {
        this.debug(err);
        if (/code E40[04]/.test(err)) {
          this.log.warn(
            'Ignoring response from unsupported `npm whoami` command.'
          );
          return true;
        }
        return false;
      }
    );
  }

  /**
   * @override
   */
  async process() {
    const context = this.getContext();
    if (context.publish !== false) {
      await this.dispatchTask({ id: TasksAction.NPM_PUBLISH });
    }
  }

  processAfter() {
    const { isReleased } = this.getContext();
    if (isReleased) {
      this.log.log(`🔗 ${this.getPackageUrl()}`);
    }
  }

  getPackageUrl() {
    const baseUrl = this.getRegistry() || NPM_BASE_URL;
    const publicPath = this.getPublicPath() || NPM_PUBLIC_PATH;
    return urlJoin(baseUrl, publicPath, this.getName());
  }

  getRegistry() {
    const { publishConfig } = this.getContext();
    const registries = publishConfig
      ? publishConfig.registry
        ? [publishConfig.registry]
        : Object.keys(publishConfig)
            .filter((key) => key.endsWith('registry'))
            .map((key) => publishConfig[key])
      : [];
    return registries[0];
  }

  async publish() {
    const context = this.getContext();
    const {
      publishPath = '.',
      private: isPrivate,
      tag = DEFAULT_TAG
    } = context;

    if (isPrivate) {
      this.log.warn('Skip publish: package is private.');
      return false;
    }

    const command = ['npm publish', publishPath, `--tag ${tag}`];

    await this.exec(command, noStdout);
    this.setContext({ isReleased: true });
  }
}
