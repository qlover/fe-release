import { pathToFileURL, fileURLToPath } from 'url';
import { parse, dirname, join, resolve } from 'path';
import { createRequire } from 'module';
import { readdirSync } from 'fs';
import { Files } from '@qlover/fe-node-lib';
import { cosmiconfigSync } from 'cosmiconfig';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fePkg = Files.readJSON(resolve(__dirname, '../../package.json'));

/**
 * @private
 */
export class Loader {
  static readFilePlugins(targetPath) {
    try {
      const files = readdirSync(targetPath);
      return files
        .filter((file) => file.endsWith('.js'))
        .map((file) => file.split('.').slice(0, -1).join('.'));
    } catch (err) {
      console.error('Unable to scan directory: ' + err);
    }
    return [];
  }

  static async getPlugins(injectPlugins = {}) {
    /**
     * @type {Array<[string, import('./PluginBase.js').default]>}
     */
    const plugins = [];
    const innerPlugins = Loader.readFilePlugins(join(__dirname, 'plugins'));

    // inner
    for (const innerPlugin of innerPlugins) {
      const pluginRoot = resolve(__dirname, `plugins/${innerPlugin}.js`);
      const result = await Loader.load(pluginRoot);
      plugins.push(result);
    }

    // out
    const pluginsDomains = Object.keys(injectPlugins).filter(
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
      return parse(pluginName).name;
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
      // log.error(err);
      try {
        const module = await import(join(process.cwd(), domain));
        plugin = module.default;
      } catch (err) {
        // log.error(err);
        // In some cases or tests we might need to support legacy `require.resolve`
        const require = createRequire(process.cwd());
        const module = await import(
          pathToFileURL(require.resolve(domain, { paths: [process.cwd()] }))
        );
        plugin = module.default;
      }
    }
    return [Loader.getPluginName(domain), plugin];
  }

  /**
   * load fe-release project package.json
   * @private
   * @returns
   */
  static getLocalPackageJSON() {
    return fePkg;
  }

  /**
   * load outter project package.json
   * @private
   * @returns
   */
  static loadPackageJSON() {
    return Files.readJSON(resolve('./package.json'));
  }

  static async reducesPluginMaps(pluginMaps = {}, handler) {
    const plugins = [];
    const pluginsDomains = Object.keys(pluginMaps);

    for (const domain of pluginsDomains) {
      const [namespace, Plugin] = await Loader.load(domain);

      if (handler) {
        const props = pluginMaps[domain];
        const instance = await handler({ namespace, Plugin, props });
        instance && plugins.push(instance);
      }
    }

    return plugins;
  }

  /**
   * get outter fe-release config
   * @param {object} param0
   * @param {string | false} param0.file
   * @param {string} param0.dir
   * @returns
   */
  static searchFeReleaseConfig({
    moduleName,
    file,
    dir = process.cwd(),
    searchPlaces,
    loaders
  }) {
    const temp = {};
    if (file === false) return temp;
    const explorer = cosmiconfigSync(moduleName, { searchPlaces, loaders });
    const result = file ? explorer.load(file) : explorer.search(dir);

    if (result && typeof result.config === 'string') {
      throw new Error(`Invalid configuration file at ${result.filepath}`);
    }

    return result && result.config ? result.config : temp;
  }
}
