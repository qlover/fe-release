import { EOL } from 'node:os';
import lodash from 'lodash';

const log = console;
export default class ContextFormat {
  /**
   * 用于格式化字符串
   *
   * @example
   * format("git commit -m '${message}'", { message: 'first commit' })
   * // git commit -m 'first commit'
   * @param {*} template
   * @param {*} context
   * @returns
   */
  static format(template = '', context = {}) {
    try {
      return lodash.template(template)(context);
    } catch (error) {
      log.error(
        `Unable to render template with context:\n${template}\n${JSON.stringify(context)}`
      );
      log.error(error);
      throw error;
    }
  }

  static truncateLines(input, maxLines = 10, surplusText = null) {
    const lines = input.split(EOL);
    const surplus = lines.length - maxLines;
    const output = lines.slice(0, maxLines).join(EOL);
    return surplus > 0
      ? surplusText
        ? `${output}${surplusText}`
        : `${output}${EOL}...and ${surplus} more`
      : output;
  }
}
