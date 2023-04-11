import { QueueNames } from "@sims/utilities";

export function describeProcessorRootTest(queueName: QueueNames) {
  return `Processor E2E tests for ${queueName}`;
}
