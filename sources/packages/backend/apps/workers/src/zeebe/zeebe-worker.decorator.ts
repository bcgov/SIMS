import { ZBWorkerOptions } from "@camunda8/sdk/dist/zeebe/types";
import { MessagePattern } from "@nestjs/microservices";

/**
 * Marks a method inside a controller as a Zeebe job worker to execute some workflow task.
 * @see https://docs.camunda.io/docs/0.25/components/zeebe/basics/job-workers.
 * @param taskType unique name of the workflow task to be executed.
 * Defined inside a workflow task of type 'Service task' under 'Task definition' properties.
 * @param options optional configurations for this worker.
 * @returns message pattern decorator that can be identified as as part of the Zeebe strategy
 * under the ZeebeTransportStrategy.
 */
export const ZeebeWorker = (
  taskType: string,
  options?: ZBWorkerOptions,
): MethodDecorator => {
  return MessagePattern(taskType, { options });
};
