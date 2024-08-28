import {
  ApplicationStatus,
  COEStatus,
  DisbursementScheduleStatus,
  NotificationMessageType,
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
import { PartTimeECertFeedbackIntegrationScheduler } from "../ecert-part-time-feedback-integration.scheduler";
import { IsNull } from "typeorm";

const FEEDBACK_ERROR_FILE_SINGLE_RECORD =
  "EDU.PBC.NEW.ECERTSFB.PT.SINGLERECORD";
const FEEDBACK_ERROR_FILE_MULTIPLE_RECORDS =
  "EDU.PBC.NEW.ECERTSFB.PT.MULTIPLERECORDS";
const FEEDBACK_ERROR_NON_NOTIFICATION_FILE =
  "EDU.PBC.NEW.ECERTSFB.PT.ERRORNONNOTIFICATION";
const SHARED_DOCUMENT_NUMBER = 7777;
const SHARED_ERROR_CODE = "EDU-00128";

describe(
  describeQueueProcessorRootTest(QueueNames.PartTimeFeedbackIntegration),
  () => {
    let app: INestApplication;
    let processor: PartTimeECertFeedbackIntegrationScheduler;
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
      processor = app.get(PartTimeECertFeedbackIntegrationScheduler);
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
          // Force the record type in header to be wrong.
          file.header = file.header.replace("01", "10");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processPartTimeResponses(mockedJob.job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEEDBACK_ERROR_FILE_SINGLE_RECORD,
      );
      expect(result).toContain(
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      );
      expect(result.length).toBe(3);
      expect(
        mockedJob.containLogMessages([
          `Error downloading and parsing the file ${downloadedFile}. The E-Cert file has an invalid record type code on header.`,
        ]),
      ).toBe(true);
      // The file is not expected to be archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it("Should log 'Invalid record type' error when the record type of footer is invalid.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [FEEDBACK_ERROR_FILE_SINGLE_RECORD],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the record type in footer to be wrong.
          file.footer = file.footer.replace("9", "8");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processPartTimeResponses(mockedJob.job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEEDBACK_ERROR_FILE_SINGLE_RECORD,
      );
      expect(result).toContain(
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      );
      expect(result.length).toBe(3);
      expect(
        mockedJob.containLogMessages([
          `Error downloading and parsing the file ${downloadedFile}. The E-Cert file has an invalid record type code on trailer.`,
        ]),
      ).toBe(true);
      // The file is not expected to be archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it("Should log 'Invalid number of records' error when the number of records in footer is invalid.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [FEEDBACK_ERROR_FILE_SINGLE_RECORD],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the total number of records in footer to be wrong.
          file.footer = file.footer.replace("1", "2");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processPartTimeResponses(mockedJob.job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEEDBACK_ERROR_FILE_SINGLE_RECORD,
      );
      expect(result).toContain(
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      );
      expect(result.length).toBe(3);
      expect(
        mockedJob.containLogMessages([
          `Error downloading and parsing the file ${downloadedFile}. The E-Cert file has invalid number of records.`,
        ]),
      ).toBe(true);
      // The file is not expected to be archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it("Should log 'SIN Hash validation failed' error when the footer has an invalid SIN total hash.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [FEEDBACK_ERROR_FILE_SINGLE_RECORD],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the SIN hash total in footer to be wrong.
          file.footer = file.footer.replace("399800085", "399800086");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processPartTimeResponses(mockedJob.job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEEDBACK_ERROR_FILE_SINGLE_RECORD,
      );
      expect(result).toContain(
        "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      );
      expect(result.length).toBe(3);
      expect(
        mockedJob.containLogMessages([
          `Error downloading and parsing the file ${downloadedFile}. The E-Cert file has TotalSINHash inconsistent with the total sum of sin in the records.`,
        ]),
      ).toBe(true);
      // The file is expected to be archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
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
      const result = await processor.processPartTimeResponses(mockedJob.job);

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
      // The file is not expected to be archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it("Should import the feedback error file and create disbursement feedback error when the document number is valid and all the error codes received are present in the system.", async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          offeringIntensity: OfferingIntensity.partTime,
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
      const result = await processor.processPartTimeResponses(mockedJob.job);

      // Assert
      expect(result.length).toBe(1);
      expect(result).toContain("Process finalized with success.");
      expect(
        mockedJob.containLogMessages([
          "File contains 1 records.",
          `Disbursement feedback error created for document number ${SHARED_DOCUMENT_NUMBER} at line 2.`,
        ]),
      ).toBe(true);
      // When all the records are processed successfully, expect the file to be archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();

      // Assert imported feedback errors.
      const [disbursementSchedule] =
        application.currentAssessment.disbursementSchedules;
      const disbursementFeedbackErrors =
        await db.disbursementFeedbackErrors.find({
          select: {
            id: true,
            disbursementSchedule: { id: true },
            eCertFeedbackError: {
              id: true,
              errorCode: true,
              offeringIntensity: true,
            },
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
          offeringIntensity: OfferingIntensity.partTime,
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
            offeringIntensity: OfferingIntensity.partTime,
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
        const result = await processor.processPartTimeResponses(mockedJob.job);

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
        // The file is not expected to be archived on SFTP.
        expect(sftpClientMock.rename).not.toHaveBeenCalled();

        // Assert imported feedback errors.
        const [disbursementSchedule] =
          application.currentAssessment.disbursementSchedules;
        const disbursementFeedbackErrors =
          await db.disbursementFeedbackErrors.find({
            select: {
              id: true,
              disbursementSchedule: { id: true },
              eCertFeedbackError: {
                id: true,
                errorCode: true,
                offeringIntensity: true,
              },
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
            offeringIntensity: OfferingIntensity.partTime,
          },
          feedbackFileName: FEEDBACK_ERROR_FILE_MULTIPLE_RECORDS,
        });
      },
    );

    it("Should not generate a notification to the ministry when there are ecert feedback errors but none of them block funding for the disbursement.", async () => {
      // Arrange
      // Update the date sent for the notifications to current date where the date sent is null.
      await db.notification.update(
        { dateSent: IsNull() },
        { dateSent: new Date() },
      );
      await saveFakeApplicationDisbursements(db.dataSource, undefined, {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.completed,
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          documentNumber: SHARED_DOCUMENT_NUMBER,
        },
      });
      mockDownloadFiles(sftpClientMock, [FEEDBACK_ERROR_NON_NOTIFICATION_FILE]);
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processPartTimeResponses(mockedJob.job);

      // Assert
      expect(result.length).toBe(1);
      expect(result).toContain("Process finalized with success.");
      expect(
        mockedJob.containLogMessages([
          "File contains 1 records.",
          `Disbursement feedback error created for document number ${SHARED_DOCUMENT_NUMBER} at line 2.`,
        ]),
      ).toBe(true);
      // When all the records are processed successfully, expect the file to be archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();

      // Assert
      const notificationCount = await db.notification.count({
        where: {
          notificationMessage: {
            id: NotificationMessageType.ECertFeedbackFileErrorNotification,
          },
          dateSent: IsNull(),
        },
      });
      expect(notificationCount).toBe(0);
    });
  },
);
