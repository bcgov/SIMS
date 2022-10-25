import { Duration } from "zeebe-node";

/**
 * Default time that a message can wait, once it is delivery to the broker,
 * to find its correlated key.
 */
export const ZEEBE_PUBLISH_MESSAGE_DEFAULT_TIME_TO_LEAVE =
  Duration.seconds.of(10);
