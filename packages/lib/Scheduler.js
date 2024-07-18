import { Container } from './Container.js';
import { Loader } from './Loader.js';

export class Scheduler {
  static async runPlugins() {
    const plugins = await Loader.getPlugins();

    for (const plugin of plugins) {
      const [domain, Instance] = plugin;
      const instance = new Instance({ domain });

      Container.registerDomain(domain, instance);

      await instance.init();
    }
  }

  static async release() {
    await Scheduler.runPlugins();
  }
}
