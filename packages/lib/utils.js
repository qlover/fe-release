import { Logger } from '@qlover/fe-node-lib';
import lodash from 'lodash';

export const format = (template = '', context = {}) => {
  try {
    return lodash.template(template)(context);
  } catch (error) {
    const log = new Logger();
    log.error(
      `Unable to render template with context:\n${template}\n${JSON.stringify(context)}`
    );
    log.error(error);
    throw error;
  }
};

export function sleep(ms = 16) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
