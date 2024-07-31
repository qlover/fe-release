import { Loader } from './Loader.js';
import { Logger, Shell } from '@qlover/fe-node-lib';
import Config from './Config.js';
import { Container } from './Container.js';
import Tasks from './Tasks.js';

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
    this.container.register(Tasks, new Tasks(config));

    this.config = config;
    this.log = logger;
  }

  /**
   * @private
   * @param {*} pluginInstance
   */
  async startUpPlugin(pluginInstance, pluginProps) {
    await pluginInstance.init(pluginProps);
  }

  /**
   * @returns {import('./PluginBase.js').default[]}
   */
  eachPlugins(config) {
    const container = this.container;

    const onPlugin = async ({ namespace, Plugin, props }) => {
      const instance = new Plugin({ namespace, ...props, container });

      // use Instance register(or string name)
      container.register(Plugin, instance);

      // start up Instance
      await this.startUpPlugin(instance, props);

      return instance;
    };

    return Loader.reducesPluginMaps(config.plugins, onPlugin);
  }

  async release() {
    const config = {
      plugins: {
        './plugins/Version.js': {},
        './plugins/Git.js': {}
      }
    };

    await this.eachPlugins(config);

    this.after();
  }

  after() {
    this.log.success(
      'new version is:',
      this.config.getContext('releaseVersion')
    );
  }
}
