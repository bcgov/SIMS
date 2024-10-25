import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../../test/helpers";
import { E2EDataSources, createE2EDataSources } from "@sims/test-utils";
import * as Client from "ssh2-sftp-client";
import * as path from "path";
import { SINValidationResponseIntegrationScheduler } from "../sin-validation-process-response-integration.scheduler";
import { mockDownloadFiles } from "@sims/test-utils/mocks";
import { Job } from "bull";

const SIN_VALIDATION_FILENAME = "PCSLP.PBC.BC0000.ISR";

describe(
  describeProcessorRootTest(QueueNames.SINValidationResponseIntegration),
  () => {
    let app: INestApplication;
    let processor: SINValidationResponseIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    let sinValidationResponseFolder: string;

    beforeAll(async () => {
      sinValidationResponseFolder = path.join(__dirname, "sin-receive-files");
      process.env.ESDC_RESPONSE_FOLDER = sinValidationResponseFolder;
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      processor = app.get(SINValidationResponseIntegrationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
    });

    // Add your test cases here

    // Dummy TODO test
    it("TODO: should process SIN validation response file", async () => {
      // Queued job.
      const job = createMock<Job<void>>();

      mockDownloadFiles(sftpClientMock, [SIN_VALIDATION_FILENAME]);

      // Act
      const processResult = await processor.processSINValidationResponse(job);

      console.log(processResult);
      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        SIN_VALIDATION_FILENAME,
      );
      console.log(downloadedFile);
      debugger;
      // Assert
      expect(processResult).toStrictEqual([
        {
          processSummary: [
            `Processing file ${SIN_VALIDATION_FILENAME}.`,
            "File contains:",
            "Confirmed SIN validation records (type R): 2.",
            "Cancelled SIN validation records (type C): 1.",
            "Record from line 2, updated as confirmed.",
            "Record from line 4, updated as confirmed.",
            "Record from line 3, updated as cancelled.",
          ],
          errorsSummary: [],
        },
      ]);
      // This is a placeholder test
      expect(true).toBe(true);
    });
  },
);
