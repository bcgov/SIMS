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
import { MoreThan } from "typeorm";

const FEDERAL_PROVINCIAL_FULL_TIME_FILE =
  "EDU.PBC.DIS-federal-provincial-full-time.txt";
const FEDERAL_PROVINCIAL_PART_TIME_FILE =
  "EDU.PBC.DIS-federal-provincial-part-time.txt";
const FEDERAL_ONLY_FULL_TIME_FILE = "EDU.PBC.DIS-federal-only-full-time.txt";
const SHARED_DOCUMENT_NUMBER = 989898;

describe(
  describeQueueProcessorRootTest(
    QueueNames.DisbursementReceiptsFileIntegration,
  ),
  () => {
    let app: INestApplication;
    let processor: DisbursementReceiptsFileIntegrationScheduler;
    let db: E2EDataSources;
    let sftpClientMock: DeepMocked<Client>;
    const batchRunDate = "2024-01-30";
    const fileDate = "2024-01-31";

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
        { emailContacts: ["dummy@some.domain"] },
      );
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Ensure the document number used along the tests will be unique.
      await db.disbursementSchedule.update(
        { documentNumber: SHARED_DOCUMENT_NUMBER },
        { documentNumber: 0 },
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
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          firstDisbursementInitialValues: {
            documentNumber: SHARED_DOCUMENT_NUMBER,
          },
        },
      );
      const currentTestTime = new Date();
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
            `Processing provincial daily disbursement CSV file which are not sent on ${batchRunDate}.`,
            `Provincial daily disbursement CSV report file has been sent successfully via email.`,
          ],
          errorsSummary: [],
        },
      ]);
      // Assert imported receipts.
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;
      const { bcReceipt, feReceipt } = await getReceiptsForAssert(
        firstDisbursement.id,
      );
      // Assert federal receipt.
      // Header details.
      expect(feReceipt).toEqual(
        expect.objectContaining({
          batchRunDate: batchRunDate,
          fileDate: fileDate,
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
          batchRunDate: batchRunDate,
          fileDate: fileDate,
          sequenceNumber: 3228,
        }),
      );
      // Document number.
      expect(bcReceipt.disbursementSchedule.documentNumber).toBe(
        SHARED_DOCUMENT_NUMBER,
      );
      // Disbursed loan amount.
      expect(bcReceipt.totalDisbursedAmount).toBe(123);
      const bdReceiptAwards = getExpectedAwardsFromReceiptValues(
        bcReceipt.disbursementReceiptValues,
      );
      // Disbursed grants.
      expect(bdReceiptAwards).toStrictEqual({
        BCSG: 599,
      });
      // Notification record.
      const notification = await db.notification.findOne({
        select: {
          messagePayload: true,
          createdAt: true,
        },
        where: {
          createdAt: MoreThan(currentTestTime),
        },
      });
      const emailContact = notification.messagePayload["email_address"];
      const file =
        notification.messagePayload["personalisation"]["application_file"][
          "file"
        ];
      const fileContent = Buffer.from(file, "base64").toString("ascii");
      expect(emailContact).toBe("dummy@some.domain");
      expect(fileContent).toContain(
        "Total Records,File Date,Batch Run Date,Sequence Number",
      );
    });

    it("Should import disbursement receipt file and create only federal awards receipt with proper awards code mappings for a full-time application when the file contains only federal receipt.", async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          firstDisbursementInitialValues: {
            documentNumber: SHARED_DOCUMENT_NUMBER,
          },
        },
      );
      const currentTestTime = new Date();
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
            `Processing provincial daily disbursement CSV file which are not sent on ${batchRunDate}.`,
            `Provincial daily disbursement CSV report file has been sent successfully via email.`,
          ],
          errorsSummary: [],
        },
      ]);
      // Assert imported receipts.
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;
      const { feReceipt, bcReceipt } = await getReceiptsForAssert(
        firstDisbursement.id,
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
          messagePayload: true,
          createdAt: true,
        },
        where: {
          createdAt: MoreThan(currentTestTime),
        },
      });
      const emailContact = notification.messagePayload["email_address"];
      const file =
        notification.messagePayload["personalisation"]["application_file"][
          "file"
        ];
      const fileContent = Buffer.from(file, "base64").toString("ascii");
      expect(emailContact).toBe("dummy@some.domain");
      expect(fileContent).toContain(
        "Total Records,File Date,Batch Run Date,Sequence Number",
      );
    });

    it("Should import disbursement receipt file and create federal and provincial awards receipts with proper awards code mappings for a part-time application when the file contains federal and provincial receipts.", async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          firstDisbursementInitialValues: {
            documentNumber: SHARED_DOCUMENT_NUMBER,
          },
        },
      );
      const currentTestTime = new Date();
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
            `Processing provincial daily disbursement CSV file which are not sent on ${batchRunDate}.`,
            `Provincial daily disbursement CSV report file has been sent successfully via email.`,
          ],
          errorsSummary: [],
        },
      ]);
      // Assert imported receipts.
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;
      const { bpReceipt, feReceipt } = await getReceiptsForAssert(
        firstDisbursement.id,
      );
      // Assert federal receipt.
      // Header details.
      expect(feReceipt).toEqual(
        expect.objectContaining({
          batchRunDate: batchRunDate,
          fileDate: fileDate,
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
          batchRunDate: batchRunDate,
          fileDate: fileDate,
          sequenceNumber: 3228,
        }),
      );
      // Document number.
      expect(bpReceipt.disbursementSchedule.documentNumber).toBe(
        SHARED_DOCUMENT_NUMBER,
      );
      // Disbursed loan amount.
      expect(bpReceipt.totalDisbursedAmount).toBe(132);
      const bdReceiptAwards = getExpectedAwardsFromReceiptValues(
        bpReceipt.disbursementReceiptValues,
      );
      // Disbursed grants.
      expect(bdReceiptAwards).toStrictEqual({
        BCSG: 600,
      });
      // Notification record.
      const notification = await db.notification.findOne({
        select: {
          messagePayload: true,
          createdAt: true,
        },
        where: {
          createdAt: MoreThan(currentTestTime),
        },
      });
      const emailContact = notification.messagePayload["email_address"];
      const file =
        notification.messagePayload["personalisation"]["application_file"][
          "file"
        ];
      const fileContent = Buffer.from(file, "base64").toString("ascii");
      expect(emailContact).toBe("dummy@some.domain");
      expect(fileContent).toContain(
        "Total Records,File Date,Batch Run Date,Sequence Number",
      );
    });

    /**
     * Get federal and provincial receipts to execute the asserts verifications.
     * @param disbursementScheduleId schedule id.
     * @returns receipts and receipts awards to execute the asserts verifications.
     */
    async function getReceiptsForAssert(
      disbursementScheduleId: number,
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
          disbursementSchedule: {
            id: disbursementScheduleId,
          },
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
