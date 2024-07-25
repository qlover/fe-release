declare module '@qlover/fe-release' {
  export type CommandArgv = {
    increment?: 'major' | 'minor' | 'patch' | false | string;
  };
  export class FeReleasePlugin extends import('../lib/plugins/PluginBase.js') {}
}
