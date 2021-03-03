import { LoggerService } from "../logger/logger.service";

export interface Loggable {
  logger(): LoggerService;
}

export function LoggerEnable() {
  return function (target: Function) {
    if (!target.prototype.logger) {
      throw new Error(
        `Loggable: The class ${target.name} should implement Loggable`,
      );
    }
    const svc = target.prototype.logger();
    if (!svc) {
      const logger = new LoggerService();
      logger.setContext(`${target.name}`);
      target.prototype.logger = () => logger;
    }
  };
}
