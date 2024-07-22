import url, { fileURLToPath } from 'url';
import path, { dirname, join, resolve } from 'path';
import { createRequire } from 'module';
import { Container } from './Container.js';
import { readdirSync } from 'fs';
import { Files } from '@qlover/fe-node-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = {
  plugins: {}
};

export class Loader {
  static readFilePlugins(targetPath) {
    try {
      const files = readdirSync(targetPath);
      return files
        .filter((file) => file.startsWith('Plugin'))
        .map((file) => file.split('.').slice(0, -1).join('.'));
    } catch (err) {
      Container.log.error('Unable to scan directory: ' + err);
    }
    return [];
  }

  static async getPlugins() {
    /**
     * @type {Array<[string, import('./plugin/AbstractPlugin.js').default]>}
     */
    const plugins = [];
    const innerPlugins = Loader.readFilePlugins(join(__dirname, 'plugin'));

    // inner
    for (const innerPlugin of innerPlugins) {
      const pluginRoot = resolve(__dirname, `plugin/${innerPlugin}.js`);
      const result = await Loader.load(pluginRoot);
      plugins.push(result);
    }

    // out
    const pluginsDomains = Object.keys(config.plugins).filter(
      (domain) => !innerPlugins.includes(domain)
    );

    for (const domain of pluginsDomains) {
      const result = await Loader.load(domain);
      plugins.push([result[1].name, result[1]]);
    }

    return plugins;
  }

  static getPluginName(pluginName) {
    if (pluginName.startsWith('.')) {
      return path.parse(pluginName).name;
    }

    return pluginName;
  }

  /**
   *
   * @param {string} domain
   */
  static async load(domain) {
    let plugin = null;
    try {
      const module = await import(domain);
      plugin = module.default;
    } catch (err) {
      Container.log.verbose(err);
      try {
        const module = await import(path.join(process.cwd(), domain));
        plugin = module.default;
      } catch (err) {
        Container.log.verbose(err);
        // In some cases or tests we might need to support legacy `require.resolve`
        const require = createRequire(process.cwd());
        const module = await import(
          url.pathToFileURL(require.resolve(domain, { paths: [process.cwd()] }))
        );
        plugin = module.default;
      }
    }
    return [Loader.getPluginName(domain), plugin];
  }

  static loadPackageJSON() {
    return Files.readJSON(
      resolve(dirname(fileURLToPath(import.meta.url)), '../../package.json')
    );
  }
}
