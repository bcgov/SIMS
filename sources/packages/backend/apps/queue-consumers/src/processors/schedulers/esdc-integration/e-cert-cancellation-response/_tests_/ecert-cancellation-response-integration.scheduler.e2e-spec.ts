import {
  E2EDataSources,
  createE2EDataSources,
  createFakeDisbursementOveraward,
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
import { ECertCancellationResponseIntegrationScheduler } from "../ecert-cancellation-response-integration.scheduler";
import { In } from "typeorm";
import {
  OfferingIntensity,
  ApplicationStatus,
  COEStatus,
  DisbursementScheduleStatus,
  DisbursementOverawardOriginType,
} from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";

const FULL_TIME_CANCELLATION_RESPONSE_FILE = "EDU.PBC.CAN.ECRT.20250516.001";
const PART_TIME_CANCELLATION_RESPONSE_FILE = "EDU.PBC.CAN.PTECRT.20250417.001";
// Document numbers used in the tests for Full-time and Part-time E-Cert cancellation response files respectively.
const SHARED_DOCUMENT_NUMBERS = [11000003, 11000004, 200003, 200004];

describe(
  describeQueueProcessorRootTest(
    QueueNames.ECertCancellationResponseIntegration,
  ),
  () => {
    let app: INestApplication;
    let processor: ECertCancellationResponseIntegrationScheduler;
    let db: E2EDataSources;
    let systemUsersService: SystemUsersService;
    let sftpClientMock: DeepMocked<Client>;

    beforeAll(async () => {
      // Set the ESDC response folder to the mock folder.
      process.env.ESDC_RESPONSE_FOLDER = path.join(
        __dirname,
        "e-cert-cancellation-response-files",
      );
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(ECertCancellationResponseIntegrationScheduler);
      systemUsersService = app.get(SystemUsersService);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Ensure the document number used along the tests will be unique to the test scope.
      await db.disbursementSchedule.update(
        { documentNumber: In(SHARED_DOCUMENT_NUMBERS) },
        { documentNumber: null },
      );
    });

    it("Should log error and abort the process when the record type of header is invalid for a Part-time cancellation response file.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [PART_TIME_CANCELLATION_RESPONSE_FILE],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Set the record type in header to be wrong.
          file.header = file.header.replace("100BC", "200BC");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act/Assert
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrow(
        "One or more errors were reported during the process, please see logs for details.",
      );
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        PART_TIME_CANCELLATION_RESPONSE_FILE,
      );
      // Check for the log messages.
      expect(
        mockedJob.containLogMessages([
          "Received 1 e-cert cancellation response file(s) to process.",
          `The e-cert cancellation response file ${downloadedFile} has an invalid record type on header 200.`,
        ]),
      ).toBe(true);
      // The file is not expected to be archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it("Should log error and abort the process when the record type of footer is invalid for a Part-time cancellation response file.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [PART_TIME_CANCELLATION_RESPONSE_FILE],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Set the record type in header to be wrong.
          file.footer = file.footer.replace("999", "399");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act/Assert
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrow(
        "One or more errors were reported during the process, please see logs for details.",
      );
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        PART_TIME_CANCELLATION_RESPONSE_FILE,
      );
      // Check for the log messages.
      expect(
        mockedJob.containLogMessages([
          "Received 1 e-cert cancellation response file(s) to process.",
          `The e-cert cancellation response file ${downloadedFile} has an invalid record type on footer 399.`,
        ]),
      ).toBe(true);
      // The file is not expected to be archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it(
      "Should log error and abort the process when the total record count in footer does not match" +
        " the total detail record count of the file for a Part-time cancellation response file.",
      async () => {
        // Arrange
        mockDownloadFiles(
          sftpClientMock,
          [PART_TIME_CANCELLATION_RESPONSE_FILE],
          (fileContent: string) => {
            const file = getStructuredRecords(fileContent);
            // Set the record type in header to be wrong.
            file.footer = file.footer.replace("000000002", "000000008");
            return createFileFromStructuredRecords(file);
          },
        );
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act/Assert
        await expect(processor.processQueue(mockedJob.job)).rejects.toThrow(
          "One or more errors were reported during the process, please see logs for details.",
        );
        const downloadedFile = path.join(
          process.env.ESDC_RESPONSE_FOLDER,
          PART_TIME_CANCELLATION_RESPONSE_FILE,
        );
        // Check for the log messages.
        expect(
          mockedJob.containLogMessages([
            "Received 1 e-cert cancellation response file(s) to process.",
            `The total number of detail records 8 in the footer does not match the total count of detail records 2 in the e-cert cancellation response file ${downloadedFile}.`,
          ]),
        ).toBe(true);
        // The file is not expected to be archived on SFTP.
        expect(sftpClientMock.rename).not.toHaveBeenCalled();
      },
    );

    it(
      "Should skip the detail record and continue to process other detail records when the Part-time e-cert cancellation response file" +
        " has 2 detail records where one of the detail record has a document number that is not found.",
      async () => {
        // Arrange
        // Create fake applications with disbursements to be cancelled.
        // No data created for the first document number. So the document number will not be found.
        const [, , firstDocumentNumber, secondDocumentNumber] =
          SHARED_DOCUMENT_NUMBERS;

        const secondApplication = await saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            offeringIntensity: OfferingIntensity.partTime,
            applicationStatus: ApplicationStatus.Completed,
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              documentNumber: secondDocumentNumber,
            },
          },
        );
        const [secondDisbursement] =
          secondApplication.currentAssessment.disbursementSchedules;

        mockDownloadFiles(sftpClientMock, [
          PART_TIME_CANCELLATION_RESPONSE_FILE,
        ]);
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        // Assert
        expect(result).toStrictEqual([
          "Process finalized with success.",
          "Received cancellation files: 1.",
        ]);
        const downloadedFile = path.join(
          process.env.ESDC_RESPONSE_FOLDER,
          PART_TIME_CANCELLATION_RESPONSE_FILE,
        );
        // Check for the log messages.
        expect(
          mockedJob.containLogMessages([
            "Received 1 e-cert cancellation response file(s) to process.",
            `The downloaded file ${downloadedFile} contains 2 detail records.`,
            `No disbursement schedule found for document number ${firstDocumentNumber}. Skipping cancellation.`,
            `E-Cert with document number ${secondDocumentNumber} has been cancelled.`,
          ]),
        ).toBe(true);
        // Validate the updated disbursement schedules.
        const rejectedDisbursements = await db.disbursementSchedule.find({
          select: {
            id: true,
            disbursementScheduleStatus: true,
            disbursementScheduleStatusUpdatedBy: { id: true },
            disbursementScheduleStatusUpdatedOn: true,
          },
          relations: { disbursementScheduleStatusUpdatedBy: true },
          where: {
            documentNumber: In([firstDocumentNumber, secondDocumentNumber]),
          },
          order: { documentNumber: "ASC" },
        });
        // Only one disbursement is expected to be updated/rejected.
        expect(rejectedDisbursements).toEqual([
          {
            id: secondDisbursement.id,
            disbursementScheduleStatus: DisbursementScheduleStatus.Rejected,
            disbursementScheduleStatusUpdatedBy: {
              id: systemUsersService.systemUser.id,
            },
            disbursementScheduleStatusUpdatedOn: expect.any(Date),
          },
        ]);
        // The file is not expected to be archived on SFTP.
        expect(sftpClientMock.rename).toHaveBeenCalled();
      },
    );

    it(
      "Should cancel the e-certs when the Part-time e-cert cancellation response file" +
        " has 2 detail records with valid document numbers.",
      async () => {
        // Arrange
        // Create fake applications with disbursements to be cancelled.
        const [, , firstDocumentNumber, secondDocumentNumber] =
          SHARED_DOCUMENT_NUMBERS;
        const firstApplicationPromise = saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            offeringIntensity: OfferingIntensity.partTime,
            applicationStatus: ApplicationStatus.Completed,
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              documentNumber: firstDocumentNumber,
            },
          },
        );
        const secondApplicationPromise = saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            offeringIntensity: OfferingIntensity.partTime,
            applicationStatus: ApplicationStatus.Completed,
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              documentNumber: secondDocumentNumber,
            },
          },
        );
        const [firstApplication, secondApplication] = await Promise.all([
          firstApplicationPromise,
          secondApplicationPromise,
        ]);
        const [firstDisbursement] =
          firstApplication.currentAssessment.disbursementSchedules;
        const [secondDisbursement] =
          secondApplication.currentAssessment.disbursementSchedules;
        mockDownloadFiles(sftpClientMock, [
          PART_TIME_CANCELLATION_RESPONSE_FILE,
        ]);
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        // Assert
        expect(result).toStrictEqual([
          "Process finalized with success.",
          "Received cancellation files: 1.",
        ]);
        const downloadedFile = path.join(
          process.env.ESDC_RESPONSE_FOLDER,
          PART_TIME_CANCELLATION_RESPONSE_FILE,
        );
        // Check for the log messages.
        expect(
          mockedJob.containLogMessages([
            "Received 1 e-cert cancellation response file(s) to process.",
            `The downloaded file ${downloadedFile} contains 2 detail records.`,
            `E-Cert with document number ${firstDocumentNumber} has been cancelled.`,
            `E-Cert with document number ${secondDocumentNumber} has been cancelled.`,
          ]),
        ).toBe(true);
        // Validate the updated disbursement schedules.
        const rejectedDisbursements = await db.disbursementSchedule.find({
          select: {
            id: true,
            disbursementScheduleStatus: true,
            disbursementScheduleStatusUpdatedBy: { id: true },
            disbursementScheduleStatusUpdatedOn: true,
          },
          relations: { disbursementScheduleStatusUpdatedBy: true },
          where: {
            documentNumber: In([firstDocumentNumber, secondDocumentNumber]),
          },
          order: { documentNumber: "ASC" },
        });
        expect(rejectedDisbursements).toEqual([
          {
            id: firstDisbursement.id,
            disbursementScheduleStatus: DisbursementScheduleStatus.Rejected,
            disbursementScheduleStatusUpdatedBy: {
              id: systemUsersService.systemUser.id,
            },
            disbursementScheduleStatusUpdatedOn: expect.any(Date),
          },
          {
            id: secondDisbursement.id,
            disbursementScheduleStatus: DisbursementScheduleStatus.Rejected,
            disbursementScheduleStatusUpdatedBy: {
              id: systemUsersService.systemUser.id,
            },
            disbursementScheduleStatusUpdatedOn: expect.any(Date),
          },
        ]);
        // The file is not expected to be archived on SFTP.
        expect(sftpClientMock.rename).toHaveBeenCalled();
      },
    );

    it(
      "Should skip the detail record without any update or reversal of overawards and continue to process other detail records when the Full-time e-cert cancellation response file" +
        " has 2 detail records where one of the detail record has a document number that is already rejected.",
      async () => {
        // Arrange
        // Create fake applications with disbursements.
        // The first application will have a disbursement that is already rejected.
        const [firstDocumentNumber, secondDocumentNumber] =
          SHARED_DOCUMENT_NUMBERS;
        const firstApplicationPromise = saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Completed,
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Rejected,
              documentNumber: firstDocumentNumber,
            },
          },
        );
        const secondApplicationPromise = saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            offeringIntensity: OfferingIntensity.partTime,
            applicationStatus: ApplicationStatus.Completed,
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              documentNumber: secondDocumentNumber,
            },
          },
        );
        const [firstApplication, secondApplication] = await Promise.all([
          firstApplicationPromise,
          secondApplicationPromise,
        ]);
        const [firstDisbursement] =
          firstApplication.currentAssessment.disbursementSchedules;
        const [secondDisbursement] =
          secondApplication.currentAssessment.disbursementSchedules;
        // Create fake deducted overawards and reversed overawards for the first disbursement as it is already rejected.
        const deductedOveraward = createFakeDisbursementOveraward({
          student: firstApplication.student,
          studentAssessment: firstApplication.currentAssessment,
          disbursementSchedule: firstDisbursement,
        });
        deductedOveraward.disbursementValueCode = "CSLF";
        deductedOveraward.overawardValue = 500;
        deductedOveraward.originType =
          DisbursementOverawardOriginType.AwardDeducted;
        const reversedOveraward = {
          ...deductedOveraward,
          overawardValue: -500,
          originType: DisbursementOverawardOriginType.AwardRejectedDeducted,
        };
        await db.disbursementOveraward.save([
          deductedOveraward,
          reversedOveraward,
        ]);
        mockDownloadFiles(sftpClientMock, [
          FULL_TIME_CANCELLATION_RESPONSE_FILE,
        ]);
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        // Assert
        expect(result).toStrictEqual([
          "Process finalized with success.",
          "Received cancellation files: 1.",
        ]);
        const downloadedFile = path.join(
          process.env.ESDC_RESPONSE_FOLDER,
          FULL_TIME_CANCELLATION_RESPONSE_FILE,
        );
        // Check for the log messages.
        expect(
          mockedJob.containLogMessages([
            "Received 1 e-cert cancellation response file(s) to process.",
            `The downloaded file ${downloadedFile} contains 2 detail records.`,
            `Disbursement schedule for document number ${firstDocumentNumber} is already rejected. Skipping cancellation.`,
            `E-Cert with document number ${secondDocumentNumber} has been cancelled.`,
          ]),
        ).toBe(true);
        // Validate the updated disbursement schedules.
        const rejectedDisbursements = await db.disbursementSchedule.find({
          select: {
            id: true,
            disbursementScheduleStatus: true,
            disbursementScheduleStatusUpdatedBy: { id: true },
            disbursementScheduleStatusUpdatedOn: true,
          },
          relations: { disbursementScheduleStatusUpdatedBy: true },
          where: {
            documentNumber: In([firstDocumentNumber, secondDocumentNumber]),
          },
          order: { documentNumber: "ASC" },
        });
        expect(rejectedDisbursements).toEqual([
          {
            id: firstDisbursement.id,
            disbursementScheduleStatus: DisbursementScheduleStatus.Rejected,
            // Audit columns are not expected as the integration did not update the first disbursement.
            disbursementScheduleStatusUpdatedBy: null,
            disbursementScheduleStatusUpdatedOn: null,
          },
          {
            id: secondDisbursement.id,
            disbursementScheduleStatus: DisbursementScheduleStatus.Rejected,
            disbursementScheduleStatusUpdatedBy: {
              id: systemUsersService.systemUser.id,
            },
            disbursementScheduleStatusUpdatedOn: expect.any(Date),
          },
        ]);
        // Validate overaward reversal.
        // There must be only one reversed overaward for the first disbursement which was already existing.
        const reversedOverawards = await db.disbursementOveraward.find({
          select: {
            id: true,
            disbursementValueCode: true,
            overawardValue: true,
            addedBy: { id: true },
          },
          relations: { addedBy: true },
          where: {
            originType: DisbursementOverawardOriginType.AwardRejectedDeducted,
            disbursementSchedule: { id: firstDisbursement.id },
          },
        });
        expect(reversedOverawards).toEqual([
          {
            id: reversedOveraward.id,
            disbursementValueCode: reversedOveraward.disbursementValueCode,
            overawardValue: reversedOveraward.overawardValue,
            addedBy: null,
          },
        ]);
        // The file is not expected to be archived on SFTP.
        expect(sftpClientMock.rename).toHaveBeenCalled();
      },
    );

    it(
      "Should cancel the e-certs and reverse deducted overawards if present when the Full-time e-cert cancellation response file" +
        " has 2 detail records with valid document numbers.",
      async () => {
        // Arrange
        // Create fake applications with disbursements to be cancelled.
        const [firstDocumentNumber, secondDocumentNumber] =
          SHARED_DOCUMENT_NUMBERS;
        const firstApplicationPromise = saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            offeringIntensity: OfferingIntensity.fullTime,
            applicationStatus: ApplicationStatus.Completed,
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              documentNumber: firstDocumentNumber,
            },
          },
        );
        const secondApplicationPromise = saveFakeApplicationDisbursements(
          db.dataSource,
          undefined,
          {
            offeringIntensity: OfferingIntensity.partTime,
            applicationStatus: ApplicationStatus.Completed,
            firstDisbursementInitialValues: {
              coeStatus: COEStatus.completed,
              disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
              documentNumber: secondDocumentNumber,
            },
          },
        );
        const [firstApplication, secondApplication] = await Promise.all([
          firstApplicationPromise,
          secondApplicationPromise,
        ]);
        const [firstDisbursement] =
          firstApplication.currentAssessment.disbursementSchedules;
        const [secondDisbursement] =
          secondApplication.currentAssessment.disbursementSchedules;
        // Create fake deducted overawards for the first disbursement.
        const deductedOveraward = createFakeDisbursementOveraward({
          student: firstApplication.student,
          studentAssessment: firstApplication.currentAssessment,
          disbursementSchedule: firstDisbursement,
        });
        deductedOveraward.disbursementValueCode = "CSLF";
        deductedOveraward.overawardValue = 500;
        deductedOveraward.originType =
          DisbursementOverawardOriginType.AwardDeducted;
        await db.disbursementOveraward.save(deductedOveraward);
        mockDownloadFiles(sftpClientMock, [
          FULL_TIME_CANCELLATION_RESPONSE_FILE,
        ]);
        // Queued job.
        const mockedJob = mockBullJob<void>();

        // Act
        const result = await processor.processQueue(mockedJob.job);

        // Assert
        expect(result).toStrictEqual([
          "Process finalized with success.",
          "Received cancellation files: 1.",
        ]);
        const downloadedFile = path.join(
          process.env.ESDC_RESPONSE_FOLDER,
          FULL_TIME_CANCELLATION_RESPONSE_FILE,
        );
        // Validate the updated disbursement schedules.
        const rejectedDisbursements = await db.disbursementSchedule.find({
          select: {
            id: true,
            disbursementScheduleStatus: true,
            disbursementScheduleStatusUpdatedBy: { id: true },
            disbursementScheduleStatusUpdatedOn: true,
          },
          relations: { disbursementScheduleStatusUpdatedBy: true },
          where: {
            documentNumber: In([firstDocumentNumber, secondDocumentNumber]),
          },
          order: { documentNumber: "ASC" },
        });
        expect(rejectedDisbursements).toEqual([
          {
            id: firstDisbursement.id,
            disbursementScheduleStatus: DisbursementScheduleStatus.Rejected,
            disbursementScheduleStatusUpdatedBy: {
              id: systemUsersService.systemUser.id,
            },
            disbursementScheduleStatusUpdatedOn: expect.any(Date),
          },
          {
            id: secondDisbursement.id,
            disbursementScheduleStatus: DisbursementScheduleStatus.Rejected,
            disbursementScheduleStatusUpdatedBy: {
              id: systemUsersService.systemUser.id,
            },
            disbursementScheduleStatusUpdatedOn: expect.any(Date),
          },
        ]);
        // Validate overaward reversal.
        const reversedOverawards = await db.disbursementOveraward.find({
          select: {
            id: true,
            disbursementValueCode: true,
            overawardValue: true,
            addedBy: { id: true },
          },
          relations: { addedBy: true },
          where: {
            originType: DisbursementOverawardOriginType.AwardRejectedDeducted,
            disbursementSchedule: { id: firstDisbursement.id },
          },
        });
        expect(reversedOverawards).toEqual([
          {
            id: expect.any(Number),
            disbursementValueCode: "CSLF",
            overawardValue: -500,
            addedBy: { id: systemUsersService.systemUser.id },
          },
        ]);
        // Check for the log messages.
        expect(
          mockedJob.containLogMessages([
            "Received 1 e-cert cancellation response file(s) to process.",
            `The downloaded file ${downloadedFile} contains 2 detail records.`,
            `E-Cert with document number ${firstDocumentNumber} has been cancelled.`,
            `E-Cert with document number ${secondDocumentNumber} has been cancelled.`,
            `Reversal overaward(s) created: ${reversedOverawards
              .map((overaward) => overaward.id)
              .join(", ")}.`,
          ]),
        ).toBe(true);
        // The file is not expected to be archived on SFTP.
        expect(sftpClientMock.rename).toHaveBeenCalled();
      },
    );
  },
);
