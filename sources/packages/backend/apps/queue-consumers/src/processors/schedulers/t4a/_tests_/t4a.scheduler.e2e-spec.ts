import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import MockDate from "mockdate";
import { T4UploaderScheduler } from "../t4a-upload-enqueuer.scheduler";

describe(
  describeProcessorRootTest(QueueNames.CASInvoicesBatchesCreation),
  () => {
    let app: INestApplication;
    let processor: T4UploaderScheduler;

    beforeAll(async () => {
      const { nestApplication } = await createTestingAppModule();
      app = nestApplication;
      // Processor under test.
      processor = app.get(T4UploaderScheduler);
    });

    beforeEach(async () => {
      MockDate.reset();
    });

    it("Should download the files from the SFTP and create then in the student account when files are available in the SFTP with expected name convention.", async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(result).toBeDefined();
    });

    afterAll(async () => {
      await app?.close();
    });
  },
);
