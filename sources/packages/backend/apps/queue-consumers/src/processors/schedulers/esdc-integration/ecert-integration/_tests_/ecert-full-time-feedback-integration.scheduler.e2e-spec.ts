import {
  ApplicationStatus,
  COEStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import {
  createFileFromStructuredRecords,
  getStructuredRecords,
  mockDownloadFiles,
} from "@sims/test-utils/mocks";
import {
  createTestingAppModule,
  describeQueueProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import { DeepMocked } from "@golevelup/ts-jest";
import * as Client from "ssh2-sftp-client";
import * as path from "path";
import { FullTimeECertFeedbackIntegrationScheduler } from "../ecert-full-time-feedback-integration.scheduler";

const FEEDBACK_ERROR_FILE_SINGLE_RECORD = "EDU.PBC.FTECERTSFB.SINGLERECORD";
const FEEDBACK_ERROR_FILE_MULTIPLE_RECORDS =
  "EDU.PBC.FTECERTSFB.MULTIPLERECORDS";
const SHARED_DOCUMENT_NUMBER = 6666;
const SHARED_ERROR_CODE = "EDU-00099";

describe(
  describeQueueProcessorRootTest(QueueNames.FullTimeFeedbackIntegration),
  () => {
    let app: INestApplication;
    let processor: FullTimeECertFeedbackIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;

    beforeAll(async () => {
      // Set the ESDC response folder to the mock folder.
      process.env.ESDC_RESPONSE_FOLDER = path.join(
        __dirname,
        "e-cert-feedback-error-files",
      );
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(FullTimeECertFeedbackIntegrationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Ensure the document number used along the tests will be unique.
      await db.disbursementSchedule.update(
        { documentNumber: SHARED_DOCUMENT_NUMBER },
        { documentNumber: null },
      );
    });

    it("Should log 'Invalid record type' error when the record type of header is invalid.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [FEEDBACK_ERROR_FILE_SINGLE_RECORD],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the header to be wrong.
          file.header = file.header.replace("100222  NEW", "500222  NEW");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processFullTimeResponses(mockedJob.job);

      // Assert
      expect(result).toContain(
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      );
      expect(result.length).toBe(3);
      expect(
        mockedJob.containLogMessages([
          "The E-Cert file has an invalid record type code on header.",
        ]),
      ).toBe(true);
      // The file is not expected to be deleted from SFTP.
      expect(sftpClientMock.delete).not.toHaveBeenCalled();
    });

    it("Should log 'Invalid record type' error when the record type of footer is invalid.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [FEEDBACK_ERROR_FILE_SINGLE_RECORD],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the SIN hash total footer to be wrong.
          file.footer = file.footer.replace("999 NEW", "777 NEW");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processFullTimeResponses(mockedJob.job);

      // Assert
      expect(result).toContain(
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      );
      expect(result.length).toBe(3);
      expect(
        mockedJob.containLogMessages([
          "The E-Cert file has an invalid record type code on trailer.",
        ]),
      ).toBe(true);
      // The file is not expected to be deleted from SFTP.
      expect(sftpClientMock.delete).not.toHaveBeenCalled();
    });

    it("Should log 'Invalid number of records' error when the number of records in footer is invalid.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [FEEDBACK_ERROR_FILE_SINGLE_RECORD],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the SIN hash total footer to be wrong.
          file.footer = file.footer.replace("1000000001", "1000000002");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processFullTimeResponses(mockedJob.job);

      // Assert
      expect(result).toContain(
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      );
      expect(result.length).toBe(3);
      expect(
        mockedJob.containLogMessages([
          "The E-Cert file has invalid number of records.",
        ]),
      ).toBe(true);
      // The file is not expected to be deleted from SFTP.
      expect(sftpClientMock.delete).not.toHaveBeenCalled();
    });

    it("Should log 'SIN Hash validation failed' error when the footer has an invalid SIN total hash.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [FEEDBACK_ERROR_FILE_SINGLE_RECORD],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the SIN hash total footer to be wrong.
          file.footer = file.footer.replace("399800143", "399800144");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processFullTimeResponses(mockedJob.job);

      // Assert
      expect(result).toContain(
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      );
      expect(result.length).toBe(3);
      expect(
        mockedJob.containLogMessages([
          "The E-Cert file has TotalSINHash inconsistent with the total sum of sin in the records.",
        ]),
      ).toBe(true);
      // The file is not expected to be deleted from SFTP.
      expect(sftpClientMock.delete).not.toHaveBeenCalled();
    });

    it("Should log 'Unknown error code' error when one or more error codes received is not in the system.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [FEEDBACK_ERROR_FILE_SINGLE_RECORD],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the error code to be wrong in the first record.
          const [record] = file.records;
          file.records = [record.replace(SHARED_ERROR_CODE, "UKN-00200")];
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processFullTimeResponses(mockedJob.job);

      // Assert
      expect(result).toContain(
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      );
      expect(result.length).toBe(3);
      expect(
        mockedJob.containLogMessages([
          "The following error codes are unknown to the system: UKN-00200.",
        ]),
      ).toBe(true);
      // The file is not expected to be deleted from SFTP.
      expect(sftpClientMock.delete).not.toHaveBeenCalled();
    });

    it("Should import the feedback error file and create disbursement feedback error when the document number is valid and all the error codes received are present in the system.", async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            documentNumber: SHARED_DOCUMENT_NUMBER,
          },
        },
      );
      mockDownloadFiles(sftpClientMock, [FEEDBACK_ERROR_FILE_SINGLE_RECORD]);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processFullTimeResponses(mockedJob.job);

      // Assert
      expect(result.length).toBe(1);
      expect(result).toContain("Process finalized with success.");
      expect(
        mockedJob.containLogMessages([
          "File contains 1 records.",
          `Disbursement feedback error created for document number ${SHARED_DOCUMENT_NUMBER} at line 2.`,
        ]),
      ).toBe(true);
      // When all the records are processed successfully, expect the file to be deleted from SFTP.
      expect(sftpClientMock.delete).toHaveBeenCalled();

      // Assert imported feedback errors.
      const [disbursementSchedule] =
        application.currentAssessment.disbursementSchedules;
      const disbursementFeedbackErrors =
        await db.disbursementFeedbackErrors.find({
          select: {
            id: true,
            disbursementSchedule: { id: true },
            eCertFeedbackError: { id: true, errorCode: true },
            feedbackFileName: true,
          },
          relations: { disbursementSchedule: true, eCertFeedbackError: true },
          where: {
            disbursementSchedule: { documentNumber: SHARED_DOCUMENT_NUMBER },
          },
        });
      expect(disbursementFeedbackErrors.length).toBe(1);
      const [importedError] = disbursementFeedbackErrors;
      expect(importedError).toEqual({
        id: expect.any(Number),
        disbursementSchedule: { id: disbursementSchedule.id },
        eCertFeedbackError: {
          id: expect.any(Number),
          errorCode: SHARED_ERROR_CODE,
        },
        feedbackFileName: FEEDBACK_ERROR_FILE_SINGLE_RECORD,
      });
    });

    it(
      "Should log 'Document number not found' error for document numbers not found in the system but continue to import the other document numbers" +
        " when one or more document number is not found in the system.",
      async () => {
        // Arrange
        const application = await saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Completed,
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              documentNumber: SHARED_DOCUMENT_NUMBER,
            },
          },
        );
        mockDownloadFiles(sftpClientMock, [
          FEEDBACK_ERROR_FILE_MULTIPLE_RECORDS,
        ]);
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processFullTimeResponses(mockedJob.job);

        // Assert
        expect(result.length).toBe(3);
        expect(result).toContain(
          "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
        );
        expect(
          mockedJob.containLogMessages([
            "File contains 2 records.",
            `Disbursement feedback error created for document number ${SHARED_DOCUMENT_NUMBER} at line 2.`,
            "Error processing the record for document number 8888 at line 3. Disbursement for document number 8888 not found.",
          ]),
        ).toBe(true);
        // The file is not expected to be deleted from SFTP.
        expect(sftpClientMock.delete).not.toHaveBeenCalled();

        // Assert imported feedback errors.
        const [disbursementSchedule] =
          application.currentAssessment.disbursementSchedules;
        const disbursementFeedbackErrors =
          await db.disbursementFeedbackErrors.find({
            select: {
              id: true,
              disbursementSchedule: { id: true },
              eCertFeedbackError: { id: true, errorCode: true },
              feedbackFileName: true,
            },
            relations: { disbursementSchedule: true, eCertFeedbackError: true },
            where: {
              disbursementSchedule: { documentNumber: SHARED_DOCUMENT_NUMBER },
            },
          });
        expect(disbursementFeedbackErrors.length).toBe(1);
        const [importedError] = disbursementFeedbackErrors;
        expect(importedError).toEqual({
          id: expect.any(Number),
          disbursementSchedule: { id: disbursementSchedule.id },
          eCertFeedbackError: {
            id: expect.any(Number),
            errorCode: SHARED_ERROR_CODE,
          },
          feedbackFileName: FEEDBACK_ERROR_FILE_MULTIPLE_RECORDS,
        });
      },
    );
  },
);
