declare module '@qlover/fe-release' {
  export class FeReleasePlugin extends import(
    '../lib/plugin/AbstractPlugin.js'
  ) {}

  export type Newable<T> = new (...args: any[]) => T;
  export type ServiceIdentifier<T = unknown> = Newable<T>;

  class Container {
    static get<T>(identifier: ServiceIdentifier<T>): T;
  }
}
