import { Logger, Shell } from '@qlover/fe-node-lib';
import lodash from 'lodash';

const mapDomains = {};
const mapPrompts = {};

export class Container {
  static getDomain(domain) {
    return lodash.get(mapDomains, domain, null);
  }

  /**
   * @param {string} domain
   * @param {import('./plugin/AbstractPlugin.js').default} instance
   */
  static registerDomain(domain, instance) {
    if (!lodash.isNil(mapDomains[domain])) {
      Container.log.warn(`domain: ${domain} already register!`);
    }

    mapDomains[domain] = instance;
  }

  static getPrompt(domain, promptName) {
    return mapPrompts[domain][promptName];
  }

  static registerPrompt(pluginPrompts, namespace = 'default') {
    mapPrompts[namespace] = mapPrompts[namespace] || {};
    Object.assign(mapPrompts[namespace], pluginPrompts);
  }

  static async runPrompt({
    enabled = true,
    promptName,
    domain = 'default',
    task,
    context
  }) {
    if (!enabled) return false;

    const prompt = Container.getPrompt(domain, promptName);
    const options = Object.assign({}, prompt, {
      name: promptName,
      message: prompt.message(context),
      choices: 'choices' in prompt && prompt.choices(context),
      transformer: 'transformer' in prompt && prompt.transformer(context)
    });

    const answers = await this.createPrompt([options]);

    const doExecute = prompt.type === 'confirm' ? answers[promptName] : true;

    return doExecute && task ? await task(answers[promptName]) : false;
  }
}

Container.log = new Logger();
Container.shell = new Shell();
