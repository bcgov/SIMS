import { DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
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

    it("Should skip process SIN response file when no SIN validation was updated because the record id is already present.", async () => {
      // Arrange
      // Create a SIN record with REFERENCE_IDX = 600000001
      const validSinStudent = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: {
          sin: "100000001",
          isValidSIN: true,
        },
      });
      mockDownloadFiles(
        sftpClientMock,
        [SIN_VALIDATION_FILENAME],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          file.records[0] = file.records[0].replace(
            // Assuming the first 3 characters are some identifier, replace everything between that and position 12
            file.records[0].substring(3, 12),
            validSinStudent.sinValidation.id.toString().padStart(9, "0"),
          );
          return createFileFromStructuredRecords(file);
        },
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const processResult = await processor.processQueue(mockedJob.job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        SIN_VALIDATION_FILENAME,
      );
      expect(processResult).toStrictEqual([
        "ESDC SIN validation response files processed.",
      ]);
      expect(
        mockedJob.containLogMessages([
          `Processing file ${downloadedFile}.`,
          "File contains 2 SIN validations.",
          "Processed SIN validation record from line 2: No SIN validation was updated because the record id is already present and this is not the most updated.",
          "Processed SIN validation record from line 3: Not able to find the SIN validation on line number 3 to be updated with the ESDC response.",
        ]),
      ).toBe(true);
    });

    it("Should update one SIN validation record and skip one when one SIN response is from SIMS and the other is from SFAS.", async () => {
      // Arrange
      // Create a SIN record with REFERENCE_IDX = 600000002 and dateReceived = null to process the SIN validation record updated.
      const validSinStudent = await saveFakeStudent(db.dataSource, undefined, {
        sinValidationInitialValue: {
          sin: "100000002",
          isValidSIN: false,
          dateReceived: null,
        },
      });
      mockDownloadFiles(
        sftpClientMock,
        [SIN_VALIDATION_FILENAME],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          file.records[0] = file.records[0].replace(
            // Assuming the first 3 characters are some identifier, replace everything between that and position 12
            file.records[0].substring(3, 12),
            validSinStudent.sinValidation.id.toString().padStart(9, "0"),
          );
          return createFileFromStructuredRecords(file);
        },
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const processResult = await processor.processQueue(mockedJob.job);
      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        SIN_VALIDATION_FILENAME,
      );
      expect(processResult).toStrictEqual([
        "ESDC SIN validation response files processed.",
      ]);
      expect(
        mockedJob.containLogMessages([
          `Processing file ${downloadedFile}.`,
          "File contains 2 SIN validations.",
          "Processed SIN validation record from line 2: SIN validation record updated.",
          "Processed SIN validation record from line 3: Not able to find the SIN validation on line number 3 to be updated with the ESDC response.",
        ]),
      ).toBe(true);
    });
  },
);
