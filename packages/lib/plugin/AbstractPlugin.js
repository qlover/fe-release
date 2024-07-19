export default class AbstractPlugin {
  /**
   * @param {object} props
   * @param {string} props.domain
   * @param {import('../Process.js').Process} props.process
   */
  constructor(props = {}) {
    if (!props.domain) {
      throw new Error('Domain is required!');
    }

    this.domain = props.domain;
    this.process = props.process;
  }

  /**
   * @returns {import('../Config.js').default}
   */
  get config() {
    return this.process.config;
  }

  init() {}
}
