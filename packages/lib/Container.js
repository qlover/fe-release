import { Logger } from '@qlover/fe-node-lib';
import lodash from 'lodash';
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

    return instance;
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
      const identiterName = lodash.isString(identiter)
        ? identiter
        : identiter.name;
      throw new Error(`identiter ${identiterName} not register`);
    }

    return instance;
  }
}
