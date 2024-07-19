import Config from './Config.js';
import { Container } from './Container.js';
import { Loader } from './Loader.js';
import { Logger, Shell } from '@qlover/fe-node-lib';
import { Process } from './Process.js';

export class Scheduler {
  /**
   *
   * @param {object} props
   * @param {import('@qlover/fe-release').CommandArgv} props.argv
   */
  constructor(props) {
    this.setup(props);
  }

  setup(props) {
    Container.register(Logger, new Logger());
    Container.register(Shell, new Shell());
    Container.register(Config, new Config(props));

    Container.register(
      Process,
      new Process({
        config: Container.get(Config),
        log: Container.get(Logger),
        shell: Container.get(Shell)
      })
    );
  }

  /**
   * @returns {import('./plugin/AbstractPlugin.js').default[]}
   */
  async parsePlugins() {
    return (await Loader.getPlugins()).map((plugin) => {
      const [domain, Instance] = plugin;
      const instance = new Instance({
        domain,
        process: Container.get(Process)
      });

      Container.register(Instance, instance);

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
    Container.log.success(
      'new version is:',
      Container.process.config.context.version
    );
  }
}
