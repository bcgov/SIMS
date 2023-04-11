import { QueueNames } from "@sims/utilities";

/**
 * Creates a common E2E test description for queue processors.
 * @param queueName queue name related to the E2E test.
 * @returns E2E test description.
 */
export function describeProcessorRootTest(queueName: QueueNames) {
  return `Queue processor for ${queueName},`;
}

/**
 * Creates a common E2E test description for a scheduler queue processors.
 * @param queueName queue name related to the E2E test.
 * @returns E2E test description.
 */
export function describeQueueProcessorRootTest(queueName: QueueNames) {
  return `Scheduler queue processor for ${queueName}.`;
}
