import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { Job } from "bull";

/**
 * Result of the Bull Job mock creation.
 */
export class MockBullJobResult<T> {
  constructor(
    public readonly job: DeepMocked<Job<T>>,
    public readonly logMessages: string[],
  ) {}

  /**
   * Checks if the logs contains a entry that includes the provided parameter.
   * @param logMessage log message to be found using string includes method.
   * @returns true if the log message was found. otherwise false.
   */
  containLogMessage(logMessage: string): boolean {
    return this.logMessages.some((message) => message.includes(logMessage));
  }

  /**
   * Checks if the logs contains a entry that includes the provided parameter.
   * @param logMessages log messages to be found using string includes method.
   * @returns true if the log message was found. otherwise false.
   */
  containLogMessages(logMessages: string[]): boolean {
    for (const message of logMessages) {
      if (!this.containLogMessage(message)) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Creates a mocked Bull Job.
 * @param data optional data to start the job.
 * @returns mock creation result.
 */
export function mockBullJob<T>(data?: T): MockBullJobResult<T> {
  const job = createMock<Job<T>>({
    id: "FakeJobId",
    name: "FakeJobName",
    data: data as any,
  });
  const logMessages: string[] = [];
  job.log.mockImplementation((message: string) => {
    logMessages.push(message);
    return Promise.resolve();
  });
  return new MockBullJobResult(job, logMessages);
}
