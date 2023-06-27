import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames, getISODateOnlyString } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../../test/helpers";
import { FullTimeMSFAAProcessResponseIntegrationScheduler } from "../msfaa-full-time-process-response-integration.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  mockDownloadFiles,
  MSFAA_FULL_TIME_RECEIVE_FILE_WITH_REACTIVATION_RECORD,
  MSFAAStates,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
  createFakeMSFAANumber,
} from "@sims/test-utils";
import { THROW_AWAY_MSFAA_NUMBER } from "./msfaa-helper";
import {
  ApplicationStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import * as Client from "ssh2-sftp-client";
import { Job } from "bull";
import * as path from "path";
import { FULL_TIME_SAMPLE_MSFAA_NUMBER } from "./msfaa-process-integration.scheduler.models";
import { IsNull } from "typeorm";

describe(
  describeProcessorRootTest(QueueNames.FullTimeMSFAAProcessResponseIntegration),
  () => {
    let app: INestApplication;
    let processor: FullTimeMSFAAProcessResponseIntegrationScheduler;
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
      processor = app.get(FullTimeMSFAAProcessResponseIntegrationScheduler);
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
      // Ensuring that any previous runs of this test or any other test do not have the same Msfaa id as the one in the re-activation file.
      await db.msfaaNumber.update(
        { msfaaNumber: FULL_TIME_SAMPLE_MSFAA_NUMBER },
        { msfaaNumber: THROW_AWAY_MSFAA_NUMBER },
      );
    });

    it("Should reactivate a cancelled MSFAA when the same MSFAA is received in the response file and re-associate this reactivated MSFAA with all pending disbursements.", async () => {
      // Arrange
      // Create a cancelled MSFAA. The Msfaa number used for creating the cancelled Msfaa record is the same as the one used in the msfaa-full-time-file-with-reactivation-record.dat.
      const student = await saveFakeStudent(db.dataSource);
      const cancelledMSFAARecord = await db.msfaaNumber.save(
        createFakeMSFAANumber(
          { student },
          {
            msfaaState: MSFAAStates.CancelledOtherProvince,
            msfaaInitialValues: {
              msfaaNumber: FULL_TIME_SAMPLE_MSFAA_NUMBER,
              offeringIntensity: OfferingIntensity.fullTime,
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
            offeringIntensity: OfferingIntensity.fullTime,
          },
        },
      );
      await db.msfaaNumber.save(currentMSFAA);
      // Create 2 applications with 4 disbursements - 2 pending state and 2 sent state.
      const applicationA = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          msfaaNumber: currentMSFAA,
        },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.fullTime,
          createSecondDisbursement: true,
          firstDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
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
          offeringIntensity: OfferingIntensity.fullTime,
          createSecondDisbursement: true,
          firstDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      // Queued job.
      const job = createMock<Job<void>>();
      mockDownloadFiles(sftpClientMock, [
        MSFAA_FULL_TIME_RECEIVE_FILE_WITH_REACTIVATION_RECORD,
      ]);
      // Act
      // Now reactivate the cancelled MSFAA.
      const processResult = await processor.processMSFAA(job);
      // Assert
      expect(processResult).toStrictEqual([
        {
          processSummary: [
            `Processing file ${MSFAA_FULL_TIME_RECEIVE_FILE_WITH_REACTIVATION_RECORD}.`,
            "File contains:",
            "Confirmed MSFAA records (type R): 1.",
            "Cancelled MSFAA records (type C): 0.",
            "Record from line 1, updated as confirmed.",
          ],
          errorsSummary: [],
        },
      ]);
      // Assert that the file was deleted from SFTP.
      expect(sftpClientMock.delete).toHaveBeenCalled();
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
          relations: { msfaaNumber: true },
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
          relations: { msfaaNumber: true },
          where: { id: appBFirstDisbursementSchedule.id },
        });
      const appBSecondDisbursementScheduleMsfaaNumberId =
        await db.disbursementSchedule.findOne({
          select: {
            id: true,
            msfaaNumber: { id: true },
            disbursementScheduleStatus: true,
          },
          relations: { msfaaNumber: true },
          where: { id: appBSecondDisbursementSchedule.id },
        });
      // Validate msfaa updated for all pending disbursements.
      expect(appASecondDisbursementScheduleMsfaaNumberId.msfaaNumber.id).toBe(
        cancelledMSFAARecord.id,
      );
      expect(appBSecondDisbursementScheduleMsfaaNumberId.msfaaNumber.id).toBe(
        cancelledMSFAARecord.id,
      );
      // Validate msfaa unchanged for all sent disbursements.
      expect(appAFirstDisbursementScheduleMsfaaNumberId.msfaaNumber.id).toBe(
        currentMSFAA.id,
      );
      expect(appBFirstDisbursementScheduleMsfaaNumberId.msfaaNumber.id).toBe(
        currentMSFAA.id,
      );
    });
  },
);
