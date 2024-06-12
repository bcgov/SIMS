import { Duration } from "@camunda8/sdk/dist/zeebe";

/**
 * Timeout in milliseconds for the zeebe client to create process instance
 * and wait for response.
 */
export const PROCESS_INSTANCE_CREATE_TIMEOUT = 90000;
/**
 * While publishing a message to the workflow, this is a maximum amount of time
 * to wait before the message is discarded.
 * The E2E tests can potentially send a message to the workflow instants before the
 * workflow is even waiting for the message to arrive. This time ensures that the
 * message will continue to wait for few seconds, once it is received by Camunda,
 * and not be dropped immediately.
 */
export const PUBLISH_MESSAGE_TIME_TO_LEAVE_SECONDS = Duration.seconds.of(10);
