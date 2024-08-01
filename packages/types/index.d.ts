declare module '@qlover/fe-release' {
  export type CommandArgv = {
    increment?: 'major' | 'minor' | 'patch' | false | string;
  };
  export class FeReleasePlugin extends (await import('../lib/PluginBase.js'))
    .default {}

  type TaskPrompotType = {
    message(context: Record<string, any>): string;
    transformer?(context: Record<string, any>): string;
    choices?(): string[];
    pageSize?: number;
  };

  export type TaskInterface = TaskPrompotType & {
    /**
     * @default `true`
     */
    enabled?: boolean;

    runType?: 'prompt' | 'spinner';
    /**
     * 每个任务的 id, 唯一标识符
     */
    id: string;

    // run(props: { container: import('../lib/Container.js').Container }): void;
    run(value: any): void | Promise<any>;
  };
}
