import inquirer from 'inquirer';

export default class Prompts {
  constructor() {
    this.createPrompt = inquirer.prompt;
    this.prompts = {};
  }

  register(pluginPrompts, namespace = 'default') {
    this.prompts[namespace] = this.prompts[namespace] || {};
    Object.assign(this.prompts[namespace], pluginPrompts);
  }

  get(promptType, namespace = 'default') {
    if (!this.prompts[namespace]) {
      return;
    }
    return this.prompts[namespace][promptType];
  }

  async show({ enabled = true, type: promptName, namespace, task, context }) {
    if (!enabled) return false;
    const prompt = this.get(promptName, namespace);
    const options = Object.assign({}, prompt, {
      name: promptName,
      message: prompt.message(context),
      choices: prompt.choices ? prompt.choices(context) : [],
      transformer: prompt.transformer ? prompt.transformer(context) : undefined
    });

    const answers = await this.createPrompt([options]);

    const doExecute = prompt.type === 'confirm' ? answers[promptName] : true;

    return doExecute && task ? await task(answers[promptName]) : false;
  }
}
