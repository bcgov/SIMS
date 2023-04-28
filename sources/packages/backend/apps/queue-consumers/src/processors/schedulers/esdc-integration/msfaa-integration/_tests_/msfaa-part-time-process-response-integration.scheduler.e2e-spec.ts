import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../../test/helpers";
import { PartTimeMSFAAProcessResponseIntegrationScheduler } from "../msfaa-part-time-process-response-integration.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  mockDownloadFiles,
} from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";

describe(
  describeProcessorRootTest(QueueNames.PartTimeMSFAAProcessResponseIntegration),
  () => {
    let app: INestApplication;
    let processor: PartTimeMSFAAProcessResponseIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;

    beforeAll(async () => {
      process.env.ESDC_RESPONSE_FOLDER = path.join(
        __dirname,
        "msfaa-receive-files",
      );
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(PartTimeMSFAAProcessResponseIntegrationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
    });

    it("Should generate an MSFAA part-time file and update the dateRequested when there are pending MSFAA records.", async () => {
      // Arrange
      mockDownloadFiles(sftpClientMock, [
        "msfaa-receive-files/msfaa-receive-file-with-cancelation-records.txt",
      ]);

      // Queued job.
      const job = createMock<Job<void>>();

      mockDownloadFiles(sftpClientMock, [
        `msfaa-receive-file-with-cancelation-records.txt`,
      ]);

      // Act
      await processor.processMSFAA(job);
    });
  },
);
