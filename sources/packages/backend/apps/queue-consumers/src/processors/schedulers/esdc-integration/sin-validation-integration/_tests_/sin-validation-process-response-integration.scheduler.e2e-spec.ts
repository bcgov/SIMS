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
import {
  createFileFromStructuredRecords,
  getStructuredRecords,
  mockDownloadFiles,
} from "@sims/test-utils/mocks";
import { Job } from "bull";

const SIN_VALIDATION_FILENAME = "PCSLP.PBC.BC0000.ISR";

const padWithLeadingZeros = (num: number): string => {
  // Pad the number with leading zeros to make it 9 digits long
  return num.toString().padStart(9, "0");
};

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

    it.only("should process SIN validation response file", async () => {
      // Arrange
      // Create a SIN record with ID = 600000001
      const validSinStudent = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: {
          sin: "100000001",
          isValidSIN: true,
        },
      });
      // Create a SIN record with ID = 600000002
      const inValidSinStudent = await saveFakeStudent(
        db.dataSource,
        undefined,
        {
          sinValidationInitialValue: {
            sin: "100000002",
            isValidSIN: false,
          },
        },
      );
      await db.sinValidation.save([validSinStudent, inValidSinStudent]);

      // Queued job.
      const job = createMock<Job<void>>();
      mockDownloadFiles(sftpClientMock, [SIN_VALIDATION_FILENAME]);

      mockDownloadFiles(
        sftpClientMock,
        [SIN_VALIDATION_FILENAME],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          const [record1] = file.records;

          // Update the first record with validSinStudent's padded ID
          const paddedId1 = padWithLeadingZeros(
            validSinStudent.sinValidation.id,
          );
          file.records[0] =
            record1.substring(0, 3) + paddedId1 + record1.substring(12);
          return createFileFromStructuredRecords(file);
        },
      );

      // Act
      const processResult = await processor.processSINValidationResponse(job);
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
            "Processed SIN validation record from line 2: No SIN validation was updated because the record id is already present and this is not the most updated.",
            "Processed SIN validation record from line 3: Not able to find the SIN validation on line number 3 to be updated with the ESDC response.",
          ],
          errorsSummary: [],
        },
      ]);
    });
  },
);
