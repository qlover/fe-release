import { Loader } from './Loader.js';
import { Logger, Shell } from '@qlover/fe-node-lib';
import Config from './Config.js';
import { Container } from './Container.js';
import Tasks from './Tasks.js';
export class Scheduler {
  /**
   *
   * @param {object} options
   */
  constructor(options = {}) {
    this.container = new Container();
    const config = new Config(options);
    const logger = new Logger({
      isCI: config.isCI,
      debug: config.isDebug,
      dryRun: false
    });

    logger.debug(config.options);

    this.container.register(Logger, logger);
    this.container.register(Shell, new Shell({ log: logger }));
    this.container.register(Config, config);
    this.container.register(Tasks, new Tasks(config));

    this.config = config;
    this.log = logger;
  }

  /**
   * @returns {import('./PluginBase.js').default[]}
   */
  async eachPlugins(config) {
    const container = this.container;

    const onPlugin = async ({ namespace, Plugin, props }) => {
      const instance = new Plugin({
        namespace: namespace.toLocaleLowerCase(),
        ...props,
        container
      });

      // await Thread.sleep(1000);
      await instance.init(props);

      // use Instance register(or string name)
      return container.register(Plugin, instance);
    };

    const tasks = container.get(Tasks);

    const plugins = await tasks.dispatch({
      id: 'Init Plugins',
      run: () => Loader.reducesPluginMaps(config.plugins, onPlugin)
    });

    // process plugins
    for (const plugin of plugins) {
      await plugin.processBefore();
      await plugin.process();
      await plugin.processAfter();
    }
  }

  async release() {
    const config = {
      plugins: {
        './plugins/Version.js': {},
        './plugins/GitBase.js': {},
        './plugins/Git.js': {},
        './plugins/GitHub.js': {},
        './plugins/NPM.js': {}
      }
    };

    await this.eachPlugins(config);

    this.after();
  }

  after() {
    this.log.info('new version is:', this.config.getContext('releaseVersion'));
  }
}
