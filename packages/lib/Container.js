import { Logger } from '@qlover/fe-node-lib';

export class Container {
  constructor() {
    this.instances = new Map();
    this.log = new Logger();
  }

  register(identiter, instance) {
    if (this.instances.has(identiter)) {
      this.log.warn(`identiter: ${identiter} already register!`);
    }

    this.instances.set(identiter, instance);
  }

  /**
   * TODO: type
   * @template {T}
   * @param {new (...args: any[]) => T} identiter
   * @returns {T}
   */
  get(identiter) {
    const instance = this.instances.get(identiter);

    if (!instance) {
      throw new Error(`identiter ${identiter} not register`);
    }

    return instance;
  }
}
