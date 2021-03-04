import { LoggerService } from "../logger/logger.service";

// Logger Dependency Injector Decorator
export function InjectLogger() {
  const svc = new LoggerService();
  return function (target: any, key: string) {
    svc.setContext(`${target.constructor.name}`);
    target[key] = svc;
  };
}
