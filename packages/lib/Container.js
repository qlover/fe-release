import { Logger, Shell } from '@qlover/fe-node-lib';
import { Process } from './Process.js';

const instances = new Map();
export class Container {
  static register(identiter, instance) {
    if (instances.has(identiter)) {
      Container.log.warn(`identiter: ${identiter} already register!`);
    }

    instances.set(identiter, instance);
  }

  /**
   * TODO: type
   * @template {T}
   * @param {new (...args: any[]) => T} identiter
   * @returns {T}
   */
  static get(identiter) {
    const instance = instances.get(identiter);

    if (!instance) {
      throw new Error(`identiter not register`);
    }

    return instance;
  }

  /**
   * @returns {Logger}
   */
  static get log() {
    return Container.get(Logger);
  }

  /**
   * @returns {Shell}
   */
  static get shell() {
    return Container.get(Shell);
  }

  /**
   * @returns {Process}
   */
  static get process() {
    return Container.get(Process);
  }
}
