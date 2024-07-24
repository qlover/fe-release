import { Loader } from './Loader.js';
import { Process } from './Process.js';
export class Scheduler {
  /**
   *
   * @param {object} props
   * @param {import('@qlover/fe-release').CommandArgv} props.argv
   */
  constructor(props) {
    this.process = new Process(props);
  }

  /**
   * @returns {import('./plugin/AbstractPlugin.js').default[]}
   */
  async parsePlugins() {
    const config = {
      plugins: {}
    };

    return (await Loader.getPlugins(config.plugins)).map((plugin) => {
      const [domain, Instance] = plugin;
      const instance = new Instance({
        domain,
        process: this.process
      });

      this.process.container.register(Instance, instance);

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
    this.process.log.success(
      'new version is:',
      this.process.config.getContext('releaseVersion')
    );
  }
}
