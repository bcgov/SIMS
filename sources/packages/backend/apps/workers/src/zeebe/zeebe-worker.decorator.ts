import { MessagePattern } from "@nestjs/microservices";
import { ZBWorkerOptions } from "zeebe-node/interfaces";

export const ZeebeWorker = (
  type: string,
  options?: ZBWorkerOptions,
): MethodDecorator => {
  return MessagePattern(type, { options });
};
