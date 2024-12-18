import { DeepMocked } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, getISODateOnlyString } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../../test/helpers";
import { PartTimeMSFAAProcessResponseIntegrationScheduler } from "../msfaa-part-time-process-response-integration.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  MSFAAStates,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
  createFakeMSFAANumber,
} from "@sims/test-utils";
import {
  createFileFromStructuredRecords,
  getStructuredRecords,
  mockDownloadFiles,
  MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD,
  MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_RECORDS_COUNT,
  MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_SIN_HASH_TOTAL,
  MSFAA_PART_TIME_RECEIVE_FILE_WITH_REACTIVATION_RECORD,
} from "@sims/test-utils/mocks";
import { THROW_AWAY_MSFAA_NUMBER } from "./msfaa-helper";
import {
  ApplicationStatus,
  DisbursementScheduleStatus,
  NotificationMessageType,
  OfferingIntensity,
} from "@sims/sims-db";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";
import {
  MSFAA_PART_TIME_MARRIED,
  MSFAA_PART_TIME_OTHER_COUNTRY,
  MSFAA_PART_TIME_RELATIONSHIP_OTHER,
  PART_TIME_SAMPLE_MSFAA_NUMBER,
} from "./msfaa-process-integration.scheduler.models";
import { saveMSFAATestInputsData } from "./msfaa-factory";
import { In, IsNull } from "typeorm";

describe(
  describeProcessorRootTest(QueueNames.PartTimeMSFAAProcessResponseIntegration),
  () => {
    let app: INestApplication;
    let processor: PartTimeMSFAAProcessResponseIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    let msfaaMocksDownloadFolder: string;

    beforeAll(async () => {
      msfaaMocksDownloadFolder = path.join(__dirname, "msfaa-receive-files");
      // Set the ESDC response folder to the files mocks folders.
      process.env.ESDC_RESPONSE_FOLDER = msfaaMocksDownloadFolder;
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
      // Force any not signed MSFAA to be signed to ensure that new
      // ones created will be the only ones available to be updated.
      await db.msfaaNumber.update(
        { dateSigned: IsNull() },
        { dateSigned: getISODateOnlyString(new Date()) },
      );
      // Cancel any not canceled MSFAA.
      await db.msfaaNumber.update(
        { cancelledDate: IsNull() },
        { cancelledDate: getISODateOnlyString(new Date()) },
      );
      // Ensuring that any previous runs of this test or any other test do not have the same MSFAA numbers as the ones used below.
      const MsfaaRecordsToUpdate = [
        MSFAA_PART_TIME_MARRIED.msfaaNumber,
        MSFAA_PART_TIME_OTHER_COUNTRY.msfaaNumber,
        MSFAA_PART_TIME_RELATIONSHIP_OTHER.msfaaNumber,
        PART_TIME_SAMPLE_MSFAA_NUMBER,
      ];
      await db.msfaaNumber.update(
        {
          msfaaNumber: In(MsfaaRecordsToUpdate),
        },
        { msfaaNumber: THROW_AWAY_MSFAA_NUMBER },
      );
      // Update the date sent for the notifications to current date where the date sent is null.
      await db.notification.update(
        { dateSent: IsNull() },
        { dateSent: new Date() },
      );
    });

    it("Should process an MSFAA response with confirmations and cancellations, and save a notification message when the file is received as expected.", async () => {
      // Arrange
      const msfaaInputData = [
        MSFAA_PART_TIME_MARRIED,
        MSFAA_PART_TIME_OTHER_COUNTRY,
        MSFAA_PART_TIME_RELATIONSHIP_OTHER,
      ];
      const createdMSFAARecords = await saveMSFAATestInputsData(
        db,
        msfaaInputData,
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      mockDownloadFiles(sftpClientMock, [
        MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD,
      ]);

      // Act
      const result = await processor.processQueue(mockedJob.job);
      expect(result).toStrictEqual([
        "MSFAA part-time response files processed.",
      ]);
      // Assert
      expect(
        mockedJob.containLogMessages([
          `Processing file ${MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD}.`,
          "File contains:",
          "Confirmed MSFAA records (type R): 2.",
          "Cancelled MSFAA records (type C): 1.",
          "Record from line 2, updated as confirmed.",
          "Record from line 4, updated as confirmed.",
          "Record from line 3, updated as cancelled.",
        ]),
      ).toBe(true);
      // Assert that the file was archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
      // Find the updated MSFAA records previously created.
      const msfaaIDs = createdMSFAARecords.map((msfaa) => msfaa.id);
      const msfaaUpdatedRecords = await db.msfaaNumber.find({
        select: {
          msfaaNumber: true,
          dateSigned: true,
          serviceProviderReceivedDate: true,
          cancelledDate: true,
          newIssuingProvince: true,
          student: { id: true, user: { id: true } },
        },
        relations: { student: { user: true } },
        where: {
          id: In(msfaaIDs),
        },
        order: {
          msfaaNumber: "ASC",
        },
      });
      expect(msfaaUpdatedRecords).toHaveLength(msfaaInputData.length);
      const [firstSignedMSFAA, cancelledMSFAA, secondSignedMSFAA] =
        msfaaUpdatedRecords;
      // Validate fist confirmed record.
      expect(firstSignedMSFAA.dateSigned).toBe("2021-11-20");
      expect(firstSignedMSFAA.serviceProviderReceivedDate).toBe("2021-11-21");
      // Validate cancelled record.
      expect(cancelledMSFAA.cancelledDate).toBe("2021-11-24");
      expect(cancelledMSFAA.newIssuingProvince).toBe("ON");
      // Validate second confirmed record.
      expect(secondSignedMSFAA.dateSigned).toBe("2021-11-22");
      expect(secondSignedMSFAA.serviceProviderReceivedDate).toBe("2021-11-23");

      // Get the notification using the student and notification message id. Since a fake student is created for every test run, it will ensure uniqueness.
      // Expecting one notification for the cancelled MSFAA record.
      const studentUserId = cancelledMSFAA.student.user.id;
      const notificationMessageType = NotificationMessageType.MSFAACancellation;
      const notification = await db.notification.findOne({
        select: {
          id: true,
          dateSent: true,
          messagePayload: true,
          notificationMessage: { templateId: true },
          user: { email: true, firstName: true, lastName: true },
        },
        relations: { notificationMessage: true, user: true },
        where: {
          notificationMessage: {
            id: notificationMessageType,
          },
          user: {
            id: studentUserId,
          },
        },
      });
      expect(notification.dateSent).toBe(null);
      expect(notification.messagePayload).toStrictEqual({
        email_address: notification.user.email,
        template_id: notification.notificationMessage.templateId,
        personalisation: {
          lastName: notification.user.lastName,
          givenNames: notification.user.firstName,
        },
      });
    });

    it("Should reactivate a cancelled MSFAA when the same MSFAA is received in the response file and re-associate this reactivated MSFAA with all pending disbursements.", async () => {
      // Arrange
      // Create a cancelled MSFAA. The Msfaa number used for creating the cancelled Msfaa record is the same as the one used in the msfaa-part-time-file-with-reactivation-record.dat.
      const student = await saveFakeStudent(db.dataSource);
      const cancelledMSFAARecord = await db.msfaaNumber.save(
        createFakeMSFAANumber(
          { student },
          {
            msfaaState: MSFAAStates.CancelledOtherProvince,
            msfaaInitialValues: {
              msfaaNumber: PART_TIME_SAMPLE_MSFAA_NUMBER,
              offeringIntensity: OfferingIntensity.partTime,
            },
          },
        ),
      );
      // Create Pending MSFAA and associate it with disbursements from the two applications.
      const currentMSFAA = createFakeMSFAANumber(
        { student },
        {
          msfaaState: MSFAAStates.Pending,
          msfaaInitialValues: {
            offeringIntensity: OfferingIntensity.partTime,
          },
        },
      );
      await db.msfaaNumber.save(currentMSFAA);
      // Create 2 applications with 4 disbursements - 3 pending state and 1 sent.
      const applicationA = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber: currentMSFAA,
        },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          createSecondDisbursement: true,
        },
      );
      const applicationB = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber: currentMSFAA,
        },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          createSecondDisbursement: true,
          firstDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      // Queued job.
      const mockedJob = mockBullJob<void>();
      mockDownloadFiles(sftpClientMock, [
        MSFAA_PART_TIME_RECEIVE_FILE_WITH_REACTIVATION_RECORD,
      ]);

      // Act
      // Now reactivate the cancelled MSFAA.
      const result = await processor.processQueue(mockedJob.job);
      // Assert
      expect(result).toStrictEqual([
        "MSFAA part-time response files processed.",
      ]);
      expect(
        mockedJob.containLogMessages([
          `Processing file ${MSFAA_PART_TIME_RECEIVE_FILE_WITH_REACTIVATION_RECORD}.`,
          "File contains:",
          "Confirmed MSFAA records (type R): 1.",
          "Cancelled MSFAA records (type C): 0.",
          "Record from line 2, updated as confirmed.",
        ]),
      ).toBe(true);
      // Assert that the file was archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
      // Find the updated MSFAA records previously created.
      const msfaaReactivatedRecord = await db.msfaaNumber.findOne({
        select: {
          dateSigned: true,
          serviceProviderReceivedDate: true,
          cancelledDate: true,
          newIssuingProvince: true,
        },
        where: {
          id: cancelledMSFAARecord.id,
        },
      });
      // Validate reactivated confirmed record.
      expect(msfaaReactivatedRecord.dateSigned).toBe("2023-05-02");
      expect(msfaaReactivatedRecord.serviceProviderReceivedDate).toBe(
        "2023-05-03",
      );
      expect(msfaaReactivatedRecord.cancelledDate).toBe(null);
      expect(msfaaReactivatedRecord.newIssuingProvince).toBe(null);
      // Validate msfaa updated to the reactivated msfaa for all pending disbursements.
      const [appAFirstDisbursementSchedule, appASecondDisbursementSchedule] =
        applicationA.currentAssessment.disbursementSchedules;
      const appAFirstDisbursementScheduleMsfaaNumberId =
        await db.disbursementSchedule.findOne({
          select: {
            id: true,
            msfaaNumber: { id: true },
          },
          relations: {
            msfaaNumber: true,
          },
          where: { id: appAFirstDisbursementSchedule.id },
        });
      const appASecondDisbursementScheduleMsfaaNumberId =
        await db.disbursementSchedule.findOne({
          select: {
            id: true,
            msfaaNumber: { id: true },
          },
          relations: {
            msfaaNumber: true,
          },
          where: { id: appASecondDisbursementSchedule.id },
        });
      const [appBFirstDisbursementSchedule, appBSecondDisbursementSchedule] =
        applicationB.currentAssessment.disbursementSchedules;
      const appBFirstDisbursementScheduleMsfaaNumberId =
        await db.disbursementSchedule.findOne({
          select: {
            id: true,
            msfaaNumber: { id: true },
          },
          relations: {
            msfaaNumber: true,
          },
          where: { id: appBFirstDisbursementSchedule.id },
        });
      const appBSecondDisbursementScheduleMsfaaNumberId =
        await db.disbursementSchedule.findOne({
          select: {
            id: true,
            msfaaNumber: { id: true },
            disbursementScheduleStatus: true,
          },
          relations: {
            msfaaNumber: true,
          },
          where: { id: appBSecondDisbursementSchedule.id },
        });
      // Validate msfaa updated for all pending disbursements.
      expect(appAFirstDisbursementScheduleMsfaaNumberId.msfaaNumber.id).toBe(
        cancelledMSFAARecord.id,
      );
      expect(appASecondDisbursementScheduleMsfaaNumberId.msfaaNumber.id).toBe(
        cancelledMSFAARecord.id,
      );
      expect(appBSecondDisbursementScheduleMsfaaNumberId.msfaaNumber.id).toBe(
        cancelledMSFAARecord.id,
      );
      // Validate msfaa unchanged for all sent disbursements.
      expect(appBFirstDisbursementScheduleMsfaaNumberId.msfaaNumber.id).toBe(
        currentMSFAA.id,
      );
    });

    it("Should successfully process 2 MSFAA records when a file has 3 records but one throws an error during DB update.", async () => {
      // Arrange
      // Crate only 2 records instead of 3 to force an error while updating the missing record.
      const msfaaInputData = [
        MSFAA_PART_TIME_OTHER_COUNTRY,
        MSFAA_PART_TIME_RELATIONSHIP_OTHER,
      ];
      const createdMSFAARecords = await saveMSFAATestInputsData(
        db,
        msfaaInputData,
      );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      mockDownloadFiles(sftpClientMock, [
        MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD,
      ]);

      // Act/Assert
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrowError(
        "One or more errors were reported during the process, please see logs for details.",
      );

      const expectedFilePath = `${msfaaMocksDownloadFolder}/${MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD}`;
      expect(
        mockedJob.containLogMessages([
          `Processing file ${MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD}.`,
          "File contains:",
          "Confirmed MSFAA records (type R): 2.",
          "Cancelled MSFAA records (type C): 1.",
          "Record from line 4, updated as confirmed.",
          "Record from line 3, updated as cancelled.",
          `Error processing record line number 2 from file ${expectedFilePath}.`,
        ]),
      ).toBe(true);
      // Assert that the file was archived on SFTP.
      expect(sftpClientMock.rename).toHaveBeenCalled();
      // Find the updated MSFAA records previously created.
      const msfaaIDs = createdMSFAARecords.map((msfaa) => msfaa.id);
      const msfaaUpdatedRecords = await db.msfaaNumber.find({
        select: {
          msfaaNumber: true,
          dateSigned: true,
          serviceProviderReceivedDate: true,
          cancelledDate: true,
          newIssuingProvince: true,
        },
        where: {
          id: In(msfaaIDs),
        },
        order: {
          msfaaNumber: "ASC",
        },
      });
      expect(msfaaUpdatedRecords).toHaveLength(msfaaInputData.length);
      const [cancelledMSFAA, secondSignedMSFAA] = msfaaUpdatedRecords;
      // Validate cancelled record.
      expect(cancelledMSFAA.cancelledDate).toBe("2021-11-24");
      expect(cancelledMSFAA.newIssuingProvince).toBe("ON");
      // Validate second confirmed record.
      expect(secondSignedMSFAA.dateSigned).toBe("2021-11-22");
      expect(secondSignedMSFAA.serviceProviderReceivedDate).toBe("2021-11-23");
    });

    it("Should throw an error when the MSFAA file contains an invalid SIN hash total.", async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();

      mockDownloadFiles(sftpClientMock, [
        MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_SIN_HASH_TOTAL,
      ]);

      // Act
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrowError(
        "One or more errors were reported during the process, please see logs for details.",
      );

      // Assert
      expect(
        mockedJob.containLogMessages([
          `Processing file ${MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_SIN_HASH_TOTAL}.`,
          `Error downloading file ${MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_SIN_HASH_TOTAL}.`,
          "The MSFAA file has TotalSINHash inconsistent with the total sum of sin in the records",
        ]),
      ).toBe(true);
      // Assert that the file was not archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it("Should throw an error when the MSFAA file contains an invalid record count.", async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();

      mockDownloadFiles(sftpClientMock, [
        MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_RECORDS_COUNT,
      ]);

      // Act
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrowError(
        "One or more errors were reported during the process, please see logs for details.",
      );

      // Assert
      expect(
        mockedJob.containLogMessages([
          `Processing file ${MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_RECORDS_COUNT}.`,
          `Error downloading file ${MSFAA_PART_TIME_RECEIVE_FILE_WITH_INVALID_RECORDS_COUNT}.`,
          "The MSFAA file has invalid number of records",
        ]),
      ).toBe(true);
      // Assert that the file was not archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it("Should throw an error when the MSFAA file contains an invalid header code.", async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();

      mockDownloadFiles(
        sftpClientMock,
        [MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD],
        (fileContent: string) => {
          // Force the header to be wrong.
          return fileContent.replace("100", "999");
        },
      );

      // Act
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrowError(
        "One or more errors were reported during the process, please see logs for details.",
      );

      // Assert
      expect(
        mockedJob.containLogMessages([
          `Processing file ${MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD}.`,
          `Error downloading file ${MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD}.`,
          "The MSFAA file has an invalid transaction code on header",
        ]),
      ).toBe(true);
      // Assert that the file was not archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });

    it("Should throw an error when the MSFAA file contains an invalid footer code.", async () => {
      // Arrange
      // Queued job.
      const mockedJob = mockBullJob<void>();

      mockDownloadFiles(
        sftpClientMock,
        [MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the footer to be wrong.
          file.footer = file.footer.replace("999", "001");
          return createFileFromStructuredRecords(file);
        },
      );

      // Act
      await expect(processor.processQueue(mockedJob.job)).rejects.toThrowError(
        "One or more errors were reported during the process, please see logs for details.",
      );

      // Assert
      expect(
        mockedJob.containLogMessages([
          `Processing file ${MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD}.`,
          `Error downloading file ${MSFAA_PART_TIME_RECEIVE_FILE_WITH_CANCELATION_RECORD}.`,
          "The MSFAA file has an invalid transaction code on trailer",
        ]),
      ).toBe(true);
      // Assert that the file was not archived on SFTP.
      expect(sftpClientMock.rename).not.toHaveBeenCalled();
    });
  },
);
