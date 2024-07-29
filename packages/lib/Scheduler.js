import { Loader } from './Loader.js';
import { Logger, Shell } from '@qlover/fe-node-lib';
import Config from './Config.js';
import { Container } from './Container.js';
import Prompts from './Prompts.js';
import Spinner from './Spinner.js';

export class Scheduler {
  /**
   *
   * @param {object} props
   * @param {import('@qlover/fe-release').CommandArgv} props.argv
   */
  constructor(props) {
    this.container = new Container();
    const config = new Config({ context: props.argv });
    const logger = new Logger({
      isCI: config.isCI
    });

    // logger.test(JSON.stringify(config.context));

    this.container.register(Logger, logger);
    this.container.register(Shell, new Shell({ log: logger }));
    this.container.register(Config, config);
    this.container.register(Prompts, new Prompts());
    this.container.register(Spinner, new Spinner());

    this.config = config;
    this.log = logger;
  }

  /**
   * @returns {import('./PluginBase.js').default[]}
   */
  async parsePlugins() {
    const config = {
      plugins: {}
    };

    return (await Loader.getPlugins(config.plugins)).map((plugin) => {
      const [domain, Instance] = plugin;
      const instance = new Instance({
        namespace: domain,
        container: this.container
      });

      // use Instance register(or string name)
      this.container.register(Instance, instance);

      return instance;
    });
  }

  async release() {
    const pluginsInstances = await this.parsePlugins();

    for (const plugin of pluginsInstances) {
      await plugin.init();
    }

    this.after();
  }

  after() {
    this.log.success(
      'new version is:',
      this.config.getContext('releaseVersion')
    );
  }
}
