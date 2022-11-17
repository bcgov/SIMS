import { LoggerService } from "./logger.service";

/**
 * Logger dependency injector decorator.
 * Creates a new instance of the logger
 * setting the object name as the logger
 * context name.
 */
export function InjectLogger() {
  const logger = new LoggerService();
  return function (target: unknown, key: string) {
    logger.setContext(`${target.constructor.name}`);
    target[key] = logger;
  };
}
