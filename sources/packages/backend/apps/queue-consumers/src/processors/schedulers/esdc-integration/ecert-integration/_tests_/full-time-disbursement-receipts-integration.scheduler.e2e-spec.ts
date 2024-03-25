import {
  ApplicationStatus,
  DisbursementReceipt,
  DisbursementReceiptValue,
  OfferingIntensity,
  RECEIPT_FUNDING_TYPE_FEDERAL,
  RECEIPT_FUNDING_TYPE_PROVINCIAL,
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
import { FullTimeDisbursementReceiptsFileIntegrationScheduler } from "../full-time-disbursement-receipts-integration.scheduler";
import * as path from "path";

const FEDERAL_PROVINCIAL_FULL_TIME_FILE =
  "EDU.PBC.DIS-federal-provincial-full-time.txt";
const FEDERAL_ONLY_FULL_TIME_FILE = "EDU.PBC.DIS-federal-only-full-time.txt";
const SHARED_DOCUMENT_NUMBER = 989898;

describe(
  describeQueueProcessorRootTest(
    QueueNames.FullTimeDisbursementReceiptsFileIntegration,
  ),
  () => {
    let app: INestApplication;
    let processor: FullTimeDisbursementReceiptsFileIntegrationScheduler;
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
      processor = app.get(FullTimeDisbursementReceiptsFileIntegrationScheduler);
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
    }> {
      const receipts = await db.disbursementReceipt.find({
        select: {
          id: true,
          fundingType: true,
          totalDisbursedAmount: true,
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
        (receipt) => receipt.fundingType === RECEIPT_FUNDING_TYPE_PROVINCIAL,
      );
      const feReceipt = receipts.find(
        (receipt) => receipt.fundingType === RECEIPT_FUNDING_TYPE_FEDERAL,
      );
      return {
        feReceipt,
        bcReceipt,
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
