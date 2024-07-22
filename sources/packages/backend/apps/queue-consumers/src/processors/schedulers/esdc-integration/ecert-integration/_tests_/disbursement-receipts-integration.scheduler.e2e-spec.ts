import {
  ApplicationStatus,
  DisbursementReceipt,
  DisbursementReceiptValue,
  NotificationMessageType,
  OfferingIntensity,
  RECEIPT_FUNDING_TYPE_FEDERAL,
  RECEIPT_FUNDING_TYPE_PROVINCIAL_FULL_TIME,
  RECEIPT_FUNDING_TYPE_PROVINCIAL_PART_TIME,
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
import { DisbursementReceiptsFileIntegrationScheduler } from "../disbursement-receipts-integration.scheduler";
import * as path from "path";
import { In, IsNull } from "typeorm";

const FEDERAL_PROVINCIAL_FULL_TIME_FILE =
  "EDU.PBC.DIS-federal-provincial-full-time.txt";
const FEDERAL_PROVINCIAL_PART_TIME_FILE =
  "EDU.PBC.DIS-federal-provincial-part-time.txt";
const FEDERAL_PROVINCIAL_FULL_TIME_PART_TIME_FILE =
  "EDU.PBC.DIS-federal-provincial-full-time-part-time.txt";
const FEDERAL_ONLY_FULL_TIME_FILE = "EDU.PBC.DIS-federal-only-full-time.txt";
const SHARED_DOCUMENT_NUMBER = 989898;
const BATCH_RUN_DATE = "2024-01-30";
const FILE_DATE = "2024-01-31";
const SEQUENCE_NUMBER = 3228;
const TEST_EMAIL = "dummy@some.domain";

describe(
  describeQueueProcessorRootTest(
    QueueNames.DisbursementReceiptsFileIntegration,
  ),
  () => {
    let app: INestApplication;
    let processor: DisbursementReceiptsFileIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;

    beforeAll(async () => {
      // Set the ESDC response folder to the mock folder.
      process.env.ESDC_RESPONSE_FOLDER = path.join(
        __dirname,
        "e-cert-feedback-files",
      );
      const { nestApplication, dataSource, sshClientMock } =
        await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      sftpClientMock = sshClientMock;
      // Processor under test.
      processor = app.get(DisbursementReceiptsFileIntegrationScheduler);
      // Insert fake email contact to send ministry email.
      await db.notificationMessage.update(
        {
          id: NotificationMessageType.MinistryNotificationProvincialDailyDisbursementReceipt,
        },
        { emailContacts: [TEST_EMAIL] },
      );
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Ensure the document number used along the tests will be unique.
      await db.disbursementSchedule.update(
        { documentNumber: SHARED_DOCUMENT_NUMBER },
        { documentNumber: 0 },
      );
      // Remove disbursement receipt records associated with FILE_DATE
      // and related disbursement receipt values records.
      const disbursementReceipts = await db.disbursementReceipt.find({
        select: { id: true, disbursementReceiptValues: { id: true } },
        relations: { disbursementReceiptValues: true },
        where: { fileDate: FILE_DATE, sequenceNumber: SEQUENCE_NUMBER },
      });
      const disbursementReceiptValues = await db.disbursementReceiptValue.find({
        select: { id: true, disbursementReceipt: { id: true } },
        relations: { disbursementReceipt: true },
        where: {
          disbursementReceipt: {
            id: In(
              disbursementReceipts.map(
                (disbursementReceipt) => disbursementReceipt.id,
              ),
            ),
          },
        },
      });
      await db.disbursementReceiptValue.delete({
        id: In(
          disbursementReceiptValues.map(
            (disbursementReceiptValue) => disbursementReceiptValue.id,
          ),
        ),
      });
      await db.disbursementReceipt.delete({
        fileDate: FILE_DATE,
      });
      // Update dateSent to new Date for notification records.
      await db.notification.update(
        {
          notificationMessage: {
            id: NotificationMessageType.MinistryNotificationProvincialDailyDisbursementReceipt,
          },
        },
        { dateSent: new Date() },
      );
    });

    it("Should log 'Invalid file header' error when the header has a record code different than 'F'.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [FEDERAL_ONLY_FULL_TIME_FILE],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the header to be wrong.
          file.header = file.header.replace("BC22267890F", "BC22267890Z");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const [result] = await processor.processDisbursementReceipts(job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEDERAL_ONLY_FULL_TIME_FILE,
      );
      expect(result.errorsSummary).toContain(
        `Error downloading file ${downloadedFile}. Error: Error: Invalid file header.`,
      );
    });

    it("Should log 'SIN Hash validation failed' error when the footer has an invalid SIN total hash.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [FEDERAL_ONLY_FULL_TIME_FILE],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the SIN hash total footer to be wrong.
          file.footer = file.footer.replace(
            "000000399800069",
            "000000399800070",
          );
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const [result] = await processor.processDisbursementReceipts(job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEDERAL_ONLY_FULL_TIME_FILE,
      );
      expect(result.errorsSummary).toContain(
        `Error downloading file ${downloadedFile}. Error: Error: SIN Hash validation failed.`,
      );
    });

    it("Should log 'Invalid file footer' error when the footer has a record code different than 'T'.", async () => {
      // Arrange
      mockDownloadFiles(
        sftpClientMock,
        [FEDERAL_ONLY_FULL_TIME_FILE],
        (fileContent: string) => {
          const file = getStructuredRecords(fileContent);
          // Force the footer to be wrong.
          file.footer = file.footer.replace("BC22267890T", "BC22267890Z");
          return createFileFromStructuredRecords(file);
        },
      );
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const [result] = await processor.processDisbursementReceipts(job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEDERAL_ONLY_FULL_TIME_FILE,
      );
      expect(result.errorsSummary).toContain(
        `Error downloading file ${downloadedFile}. Error: Error: Invalid file footer.`,
      );
    });

    it("Should import disbursement receipt file and create federal and provincial awards receipts with proper awards code mappings for a full-time application when the file contains federal and provincial receipts.", async () => {
      // Arrange
      await saveFakeApplicationDisbursements(db.dataSource, undefined, {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Completed,
        firstDisbursementInitialValues: {
          documentNumber: SHARED_DOCUMENT_NUMBER,
        },
      });
      mockDownloadFiles(sftpClientMock, [FEDERAL_PROVINCIAL_FULL_TIME_FILE]);
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processDisbursementReceipts(job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEDERAL_PROVINCIAL_FULL_TIME_FILE,
      );
      expect(result).toStrictEqual([
        {
          processSummary: [
            `Processing file ${downloadedFile}.`,
            `Record with document number ${SHARED_DOCUMENT_NUMBER} at line 2 inserted successfully.`,
            `Record with document number ${SHARED_DOCUMENT_NUMBER} at line 3 inserted successfully.`,
            `Processing file ${downloadedFile} completed.`,
            `Processing provincial daily disbursement CSV file on ${FILE_DATE}.`,
            "Provincial daily disbursement CSV report generated.",
          ],
          errorsSummary: [],
        },
      ]);
      // Assert imported receipts.
      const { bcReceipt, feReceipt } = await getReceiptsForAssert(
        FILE_DATE,
        SEQUENCE_NUMBER,
      );
      // Assert federal receipt.
      // Header details.
      expect(feReceipt).toEqual(
        expect.objectContaining({
          batchRunDate: BATCH_RUN_DATE,
          fileDate: FILE_DATE,
          sequenceNumber: 3228,
        }),
      );
      // Document number.
      expect(feReceipt.disbursementSchedule.documentNumber).toBe(
        SHARED_DOCUMENT_NUMBER,
      );
      // Disbursed loan amount.
      expect(feReceipt.totalDisbursedAmount).toBe(3673);
      const feReceiptAwards = getExpectedAwardsFromReceiptValues(
        feReceipt.disbursementReceiptValues,
      );
      // Disbursed grants.
      // XYZ is a non-translated code that must be imported as it is.
      expect(feReceiptAwards).toStrictEqual({
        CSGF: 199,
        CSGT: 299,
        CSGD: 399,
        CSGP: 499,
        XYZ: 444,
      });
      // Assert provincial receipt.
      // Header details.
      expect(bcReceipt).toEqual(
        expect.objectContaining({
          batchRunDate: BATCH_RUN_DATE,
          fileDate: FILE_DATE,
          sequenceNumber: 3228,
        }),
      );
      // Document number.
      expect(bcReceipt.disbursementSchedule.documentNumber).toBe(
        SHARED_DOCUMENT_NUMBER,
      );
      // Disbursed loan amount.
      expect(bcReceipt.totalDisbursedAmount).toBe(123);
      const bcReceiptAwards = getExpectedAwardsFromReceiptValues(
        bcReceipt.disbursementReceiptValues,
      );
      // Disbursed grants.
      expect(bcReceiptAwards).toStrictEqual({
        BCSG: 599,
      });
      // Notification record.
      const createdNotification = await db.notification.findOne({
        select: {
          id: true,
          dateSent: true,
          messagePayload: true,
          notificationMessage: { id: true, templateId: true },
        },
        relations: { notificationMessage: true },
        where: {
          dateSent: IsNull(),
          notificationMessage: {
            id: NotificationMessageType.MinistryNotificationProvincialDailyDisbursementReceipt,
          },
        },
      });
      expect(createdNotification.messagePayload).toStrictEqual({
        template_id: createdNotification.notificationMessage.templateId,
        email_address: TEST_EMAIL,
        personalisation: {
          application_file: {
            file:
              "RnVsbCBUaW1lIEJDIFN0dWRlbnQgTG9hbixGdWxsIFRpbWUgQkMgU3R1ZGVudCBHcmFudCxGdWxsIFRpbWUgQkMgVG90YWwsUGFydCBUaW1lIEJDIFN0dWRlbnQgR3JhbnQsUGFydCBUaW1lIEJDIFRvdGFsLEJDIFRvdGFsLFRvdGFsIFJlY29yZHMsRmlsZSBEYXRlLEJhd" +
              "GNoIFJ1biBEYXRlLFNlcXVlbmNlIE51bWJlcg0KMTIzLjAwLDc2MC4wMCw4ODMuMDAsMCwwLDg4My4wMCwxLDIwMjQtMDEtMzEsMjAyNC0wMS0zMCwzMjI4",
            filename: `Daily_Disbursement_File_${FILE_DATE}_${SEQUENCE_NUMBER}.csv`,
            sending_method: "attach",
          },
        },
      });
      // Verify the file content as expected.
      const file =
        createdNotification.messagePayload["personalisation"][
          "application_file"
        ]["file"];
      const fileContent = Buffer.from(file, "base64").toString("ascii");
      expect(fileContent).toContain(
        "Full Time BC Student Loan,Full Time BC Student Grant,Full Time BC Total,Part Time BC Student Grant,Part Time BC Total,BC Total,Total Records,File Date,Batch Run Date,Sequence Number",
      );
      expect(fileContent).toContain(
        "123.00,760.00,883.00,0,0,883.00,1,2024-01-31,2024-01-30,3228",
      );
    });

    it("Should import disbursement receipt file and create only federal awards receipt with proper awards code mappings for a full-time application when the file contains only federal receipt.", async () => {
      // Arrange
      await saveFakeApplicationDisbursements(db.dataSource, undefined, {
        offeringIntensity: OfferingIntensity.fullTime,
        applicationStatus: ApplicationStatus.Completed,
        firstDisbursementInitialValues: {
          documentNumber: SHARED_DOCUMENT_NUMBER,
        },
      });
      mockDownloadFiles(sftpClientMock, [FEDERAL_ONLY_FULL_TIME_FILE]);
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processDisbursementReceipts(job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEDERAL_ONLY_FULL_TIME_FILE,
      );
      expect(result).toStrictEqual([
        {
          processSummary: [
            `Processing file ${downloadedFile}.`,
            `Record with document number ${SHARED_DOCUMENT_NUMBER} at line 2 inserted successfully.`,
            `Processing file ${downloadedFile} completed.`,
            `Processing provincial daily disbursement CSV file on ${FILE_DATE}.`,
          ],
          errorsSummary: [],
        },
      ]);
      // Assert imported receipts.
      const { feReceipt, bcReceipt } = await getReceiptsForAssert(
        FILE_DATE,
        SEQUENCE_NUMBER,
      );
      // BC receipt should not be present.
      expect(bcReceipt).not.toBeDefined();
      // Assert federal receipt.
      // Document number.
      expect(feReceipt.disbursementSchedule.documentNumber).toBe(
        SHARED_DOCUMENT_NUMBER,
      );
      // Disbursed loan amount.
      expect(feReceipt.totalDisbursedAmount).toBe(3673);
      const feReceiptAwards = getExpectedAwardsFromReceiptValues(
        feReceipt.disbursementReceiptValues,
      );
      // Disbursed grants.
      // XYZ is a non-translated code that must be imported as it is.
      expect(feReceiptAwards).toStrictEqual({
        CSGF: 199,
        CSGT: 299,
        CSGD: 399,
        CSGP: 499,
        XYZ: 444,
      });
      // Notification record.
      const notification = await db.notification.findOne({
        select: {
          id: true,
          dateSent: true,
          messagePayload: true,
          notificationMessage: { id: true, templateId: true },
        },
        relations: { notificationMessage: true },
        where: {
          dateSent: IsNull(),
          notificationMessage: {
            id: NotificationMessageType.MinistryNotificationProvincialDailyDisbursementReceipt,
          },
        },
      });
      expect(notification).toBe(null);
    });

    it("Should import disbursement receipt file and create federal and provincial awards receipts with proper awards code mappings for a part-time application when the file contains federal and provincial receipts.", async () => {
      // Arrange
      await saveFakeApplicationDisbursements(db.dataSource, undefined, {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        firstDisbursementInitialValues: {
          documentNumber: SHARED_DOCUMENT_NUMBER,
        },
      });
      mockDownloadFiles(sftpClientMock, [FEDERAL_PROVINCIAL_PART_TIME_FILE]);
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processDisbursementReceipts(job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEDERAL_PROVINCIAL_PART_TIME_FILE,
      );
      expect(result).toStrictEqual([
        {
          processSummary: [
            `Processing file ${downloadedFile}.`,
            `Record with document number ${SHARED_DOCUMENT_NUMBER} at line 2 inserted successfully.`,
            `Record with document number ${SHARED_DOCUMENT_NUMBER} at line 3 inserted successfully.`,
            `Processing file ${downloadedFile} completed.`,
            `Processing provincial daily disbursement CSV file on ${FILE_DATE}.`,
            "Provincial daily disbursement CSV report generated.",
          ],
          errorsSummary: [],
        },
      ]);
      // Assert imported receipts.
      const { bpReceipt, feReceipt } = await getReceiptsForAssert(
        FILE_DATE,
        SEQUENCE_NUMBER,
      );
      // Assert federal receipt.
      // Header details.
      expect(feReceipt).toEqual(
        expect.objectContaining({
          batchRunDate: BATCH_RUN_DATE,
          fileDate: FILE_DATE,
          sequenceNumber: 3228,
        }),
      );
      // Document number.
      expect(feReceipt.disbursementSchedule.documentNumber).toBe(
        SHARED_DOCUMENT_NUMBER,
      );
      // Disbursed loan amount.
      expect(feReceipt.totalDisbursedAmount).toBe(3673);
      const feReceiptAwards = getExpectedAwardsFromReceiptValues(
        feReceipt.disbursementReceiptValues,
      );
      // Disbursed grants.
      // XYZ is a non-translated code that must be imported as it is.
      expect(feReceiptAwards).toStrictEqual({
        CSGF: 199,
        CSGT: 299,
        CSGD: 399,
        CSGP: 499,
        XYZ: 444,
      });
      // Assert provincial receipt.
      // Header details.
      expect(bpReceipt).toEqual(
        expect.objectContaining({
          batchRunDate: BATCH_RUN_DATE,
          fileDate: FILE_DATE,
          sequenceNumber: 3228,
        }),
      );
      // Document number.
      expect(bpReceipt.disbursementSchedule.documentNumber).toBe(
        SHARED_DOCUMENT_NUMBER,
      );
      // Disbursed loan amount.
      expect(bpReceipt.totalDisbursedAmount).toBe(0);
      const bpReceiptAwards = getExpectedAwardsFromReceiptValues(
        bpReceipt.disbursementReceiptValues,
      );
      // Disbursed grants.
      expect(bpReceiptAwards).toStrictEqual({
        BCSG: 600,
      });
      // Notification record.
      const createdNotification = await db.notification.findOne({
        select: {
          id: true,
          dateSent: true,
          messagePayload: true,
          notificationMessage: { id: true, templateId: true },
        },
        relations: { notificationMessage: true },
        where: {
          dateSent: IsNull(),
          notificationMessage: {
            id: NotificationMessageType.MinistryNotificationProvincialDailyDisbursementReceipt,
          },
        },
      });
      expect(createdNotification.messagePayload).toStrictEqual({
        template_id: createdNotification.notificationMessage.templateId,
        email_address: TEST_EMAIL,
        personalisation: {
          application_file: {
            file:
              "RnVsbCBUaW1lIEJDIFN0dWRlbnQgTG9hbixGdWxsIFRpbWUgQkMgU3R1ZGVudCBHcmFudCxGdWxsIFRpbWUgQkMgVG90YWwsUGFydCBUaW1lIEJDIFN0dWRlbnQgR3JhbnQsUGFydCBUaW1lIEJDIFRvdGFsLEJDIFRvdGFsLFRvdGFsIFJlY29yZHMsRmlsZSBEYXRlLEJhdG" +
              "NoIFJ1biBEYXRlLFNlcXVlbmNlIE51bWJlcg0KMCwwLDAsNzYwLjAwLDc2MC4wMCw3NjAuMDAsMSwyMDI0LTAxLTMxLDIwMjQtMDEtMzAsMzIyOA==",
            filename: "Daily_Disbursement_File_2024-01-31_3228.csv",
            sending_method: "attach",
          },
        },
      });
      // Verify the file content as expected.
      const file =
        createdNotification.messagePayload["personalisation"][
          "application_file"
        ]["file"];
      const fileContent = Buffer.from(file, "base64").toString("ascii");
      expect(fileContent).toContain(
        "Full Time BC Student Loan,Full Time BC Student Grant,Full Time BC Total,Part Time BC Student Grant,Part Time BC Total,BC Total,Total Records,File Date,Batch Run Date,Sequence Number",
      );
      expect(fileContent).toContain(
        "0,0,0,760.00,760.00,760.00,1,2024-01-31,2024-01-30,3228",
      );
    });

    it("Should import disbursement receipt file and create federal and provincial full-time and part-time awards receipts with proper awards code mappings when the file contains federal and provincial receipts.", async () => {
      // Arrange
      await saveFakeApplicationDisbursements(db.dataSource, undefined, {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        firstDisbursementInitialValues: {
          documentNumber: SHARED_DOCUMENT_NUMBER,
        },
      });
      mockDownloadFiles(sftpClientMock, [
        FEDERAL_PROVINCIAL_FULL_TIME_PART_TIME_FILE,
      ]);
      // Queued job.
      const { job } = mockBullJob<void>();

      // Act
      const result = await processor.processDisbursementReceipts(job);

      // Assert
      const downloadedFile = path.join(
        process.env.ESDC_RESPONSE_FOLDER,
        FEDERAL_PROVINCIAL_FULL_TIME_PART_TIME_FILE,
      );
      expect(result).toEqual([
        {
          processSummary: [
            `Processing file ${downloadedFile}.`,
            `Record with document number ${SHARED_DOCUMENT_NUMBER} at line 2 inserted successfully.`,
            `Record with document number ${SHARED_DOCUMENT_NUMBER} at line 3 inserted successfully.`,
            `Record with document number ${SHARED_DOCUMENT_NUMBER} at line 4 inserted successfully.`,
            `Processing file ${downloadedFile} completed.`,
            `Processing provincial daily disbursement CSV file on ${FILE_DATE}.`,
            "Provincial daily disbursement CSV report generated.",
          ],
          errorsSummary: [],
        },
      ]);
      // Assert imported receipts.
      const { feReceipt, bcReceipt, bpReceipt } = await getReceiptsForAssert(
        FILE_DATE,
        SEQUENCE_NUMBER,
      );
      // Assert federal receipt.
      // Header details.
      expect(feReceipt).toEqual(
        expect.objectContaining({
          batchRunDate: BATCH_RUN_DATE,
          fileDate: FILE_DATE,
          sequenceNumber: 3228,
        }),
      );
      // Document number.
      expect(feReceipt.disbursementSchedule.documentNumber).toBe(
        SHARED_DOCUMENT_NUMBER,
      );
      // Disbursed loan amount.
      expect(feReceipt.totalDisbursedAmount).toBe(3673);
      const feReceiptAwards = getExpectedAwardsFromReceiptValues(
        feReceipt.disbursementReceiptValues,
      );
      // Disbursed grants.
      // XYZ is a non-translated code that must be imported as it is.
      expect(feReceiptAwards).toStrictEqual({
        CSGF: 199,
        CSGT: 299,
        CSGD: 399,
        CSGP: 499,
        XYZ: 444,
      });
      // Assert provincial full-time receipt.
      // Header details.
      expect(bcReceipt).toEqual(
        expect.objectContaining({
          batchRunDate: BATCH_RUN_DATE,
          fileDate: FILE_DATE,
          sequenceNumber: 3228,
        }),
      );
      // Document number.
      expect(bcReceipt.disbursementSchedule.documentNumber).toBe(
        SHARED_DOCUMENT_NUMBER,
      );
      // Disbursed loan amount.
      expect(bcReceipt.totalDisbursedAmount).toBe(123);
      const bcReceiptAwards = getExpectedAwardsFromReceiptValues(
        bcReceipt.disbursementReceiptValues,
      );
      // Disbursed grants.
      expect(bcReceiptAwards).toStrictEqual({
        BCSG: 599,
      });
      // Assert provincial part-time receipt.
      // Header details.
      expect(bpReceipt).toEqual(
        expect.objectContaining({
          batchRunDate: BATCH_RUN_DATE,
          fileDate: FILE_DATE,
          sequenceNumber: 3228,
        }),
      );
      // Document number.
      expect(bpReceipt.disbursementSchedule.documentNumber).toBe(
        SHARED_DOCUMENT_NUMBER,
      );
      // Disbursed loan amount.
      expect(bpReceipt.totalDisbursedAmount).toBe(0);
      const bpReceiptAwards = getExpectedAwardsFromReceiptValues(
        bpReceipt.disbursementReceiptValues,
      );
      // Disbursed grants.
      expect(bpReceiptAwards).toStrictEqual({
        BCSG: 600,
      });
      // Notification record.
      const createdNotification = await db.notification.findOne({
        select: {
          id: true,
          dateSent: true,
          messagePayload: true,
          notificationMessage: { id: true, templateId: true },
        },
        relations: { notificationMessage: true },
        where: {
          dateSent: IsNull(),
          notificationMessage: {
            id: NotificationMessageType.MinistryNotificationProvincialDailyDisbursementReceipt,
          },
        },
      });
      expect(createdNotification.messagePayload).toStrictEqual({
        template_id: createdNotification.notificationMessage.templateId,
        email_address: TEST_EMAIL,
        personalisation: {
          application_file: {
            file:
              "RnVsbCBUaW1lIEJDIFN0dWRlbnQgTG9hbixGdWxsIFRpbWUgQkMgU3R1ZGVudCBHcmFudCxGdWxsIFRpbWUgQkMgVG90YWwsUGFydCBUaW1lIEJDIFN0dWRlbnQgR3JhbnQsUGFydCBUaW1lIEJDIFRvdGFsLEJDIFRvdGFsLFRvdGFsIFJlY29yZHMsRmlsZSBEYXRlLEJhdGNoIFJ1biBEYXR" +
              "lLFNlcXVlbmNlIE51bWJlcg0KMTIzLjAwLDc2MC4wMCw4ODMuMDAsNzYwLjAwLDc2MC4wMCwxNjQzLjAwLDIsMjAyNC0wMS0zMSwyMDI0LTAxLTMwLDMyMjg=",
            filename: "Daily_Disbursement_File_2024-01-31_3228.csv",
            sending_method: "attach",
          },
        },
      });
      // Verify the file content as expected.
      const file =
        createdNotification.messagePayload["personalisation"][
          "application_file"
        ]["file"];
      const fileContent = Buffer.from(file, "base64").toString("ascii");
      expect(fileContent).toContain(
        "Full Time BC Student Loan,Full Time BC Student Grant,Full Time BC Total,Part Time BC Student Grant,Part Time BC Total,BC Total,Total Records,File Date,Batch Run Date,Sequence Number",
      );
      expect(fileContent).toContain(
        "123.00,760.00,883.00,760.00,760.00,1643.00,2,2024-01-31,2024-01-30,3228",
      );
    });

    afterAll(async () => {
      // Set email contact to null for provincial daily disbursement receipt notification message.
      await db.notificationMessage.update(
        {
          id: NotificationMessageType.MinistryNotificationProvincialDailyDisbursementReceipt,
        },
        { emailContacts: null },
      );
    });

    /**
     * Get federal and provincial receipts to execute the asserts verifications.
     * @param fileDate File date to be a part of filename.
     * @param sequenceNumber Sequence number to be a part of filename.
     * @returns receipts and receipts awards to execute the asserts verifications.
     */
    async function getReceiptsForAssert(
      fileDate: string,
      sequenceNumber: number,
    ): Promise<{
      feReceipt?: DisbursementReceipt;
      bcReceipt?: DisbursementReceipt;
      bpReceipt?: DisbursementReceipt;
    }> {
      const receipts = await db.disbursementReceipt.find({
        select: {
          id: true,
          fundingType: true,
          totalDisbursedAmount: true,
          batchRunDate: true,
          fileDate: true,
          sequenceNumber: true,
          disbursementSchedule: {
            id: true,
            documentNumber: true,
          },
          disbursementReceiptValues: {
            id: true,
            grantType: true,
            grantAmount: true,
          },
        },
        relations: {
          disbursementSchedule: true,
          disbursementReceiptValues: true,
        },
        where: {
          fileDate: fileDate,
          sequenceNumber: sequenceNumber,
        },
      });
      const bcReceipt = receipts.find(
        (receipt) =>
          receipt.fundingType === RECEIPT_FUNDING_TYPE_PROVINCIAL_FULL_TIME,
      );
      const bpReceipt = receipts.find(
        (receipt) =>
          receipt.fundingType === RECEIPT_FUNDING_TYPE_PROVINCIAL_PART_TIME,
      );
      const feReceipt = receipts.find(
        (receipt) => receipt.fundingType === RECEIPT_FUNDING_TYPE_FEDERAL,
      );
      return {
        feReceipt,
        bcReceipt,
        bpReceipt,
      };
    }

    /**
     * Convert the receipt award values to an object to
     * make it easier to execute the assert in the expected values.
     * @example
     * {
     *   CSGF: 199,
     *   CSGT: 299,
     *   CSGD: 399,
     *   CSGP: 499,
     * }
     * @param receiptValues receipt values.
     * @returns object with award code and its amount
     * in a property-value pair format.
     */
    function getExpectedAwardsFromReceiptValues(
      receiptValues: DisbursementReceiptValue[],
    ): Record<string, number> {
      const receiptAwards: Record<string, number> = {};
      receiptValues.forEach((receiptAward) => {
        receiptAwards[receiptAward.grantType] = receiptAward.grantAmount;
      });
      return receiptAwards;
    }
  },
);
