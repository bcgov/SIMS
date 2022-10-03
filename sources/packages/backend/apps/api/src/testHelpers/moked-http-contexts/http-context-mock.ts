import { ExecutionContext } from "@nestjs/common";
import { HttpArgumentsHost } from "@nestjs/common/interfaces";

export function createFakeHttpContext(request: any): ExecutionContext {
  const executionContext = {} as ExecutionContext;
  executionContext.getHandler = () => null;
  executionContext.getClass = () => null;

  executionContext.switchToHttp = () => {
    const httpContext = {} as HttpArgumentsHost;
    httpContext.getRequest = () => {
      return request;
    };
    return httpContext;
  };

  return executionContext;
}
