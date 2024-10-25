import { createMock, DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../../test/helpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
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
      // await db.sinValidation.delete({});
      // await db.student.delete({});
    });

    it("should process SIN validation response file", async () => {
      // Arrange

      // Create a SIN record with ID = 100000011
      const fakeStudent = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: { sin: "100000011", isValidSIN: true },
      });
      await db.sinValidation.save(fakeStudent);

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

      // Assert
      expect(processResult).toStrictEqual([
        {
          processSummary: [
            `Processing file ${downloadedFile}.`,
            "File contains 2 SIN validations.",
            "Processed SIN validation record from line 2: SIN validation skipped because it is already processed and updated.",
            "Processed SIN validation record from line 3: Not able to find the SIN validation line number 3 to be updated with the ESDC response.",
          ],
          errorsSummary: [],
        },
      ]);
    });
  },
);
