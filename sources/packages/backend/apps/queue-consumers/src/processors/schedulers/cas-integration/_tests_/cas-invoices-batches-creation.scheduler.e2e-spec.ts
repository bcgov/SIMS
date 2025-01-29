import { INestApplication } from "@nestjs/common";
import {
  createE2EDataSources,
  createFakeDisbursementValue,
  E2EDataSources,
  saveFakeApplicationDisbursements,
  saveFakeCASSupplier,
  saveFakeDisbursementReceiptsFromDisbursementSchedule,
  saveFakeStudent,
} from "@sims/test-utils";
import { QueueNames } from "@sims/utilities";
import { CASSupplierIntegrationScheduler } from "../cas-supplier-integration.scheduler";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import {
  CASInvoiceBatchApprovalStatus,
  CASInvoiceStatus,
  DisbursementValueType,
  SupplierStatus,
} from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";
import { CASInvoicesBatchesCreationScheduler } from "../cas-invoices-batches-creation.scheduler";

const CAS_INVOICE_BATCH_SEQUENCE_NAME = "CAS_INVOICE_BATCH";
const CAS_INVOICE_SEQUENCE_NAME = "CAS_INVOICE";

describe(
  describeProcessorRootTest(QueueNames.CASInvoicesBatchesCreation),
  () => {
    let app: INestApplication;
    let processor: CASSupplierIntegrationScheduler;
    let db: E2EDataSources;
    let systemUsersService: SystemUsersService;

    beforeAll(async () => {
      const { nestApplication, dataSource } = await createTestingAppModule();
      app = nestApplication;
      systemUsersService = nestApplication.get(SystemUsersService);
      db = createE2EDataSources(dataSource);
      // Processor under test.
      processor = app.get(CASInvoicesBatchesCreationScheduler);
    });

    beforeEach(async () => {
      jest.clearAllMocks();
      // Update existing records to avoid conflicts between tests.
      await db.disbursementReceiptValue.update(
        {
          grantType: "BCSG",
        },
        { grantAmount: 0 },
      );
      // Delete all existing invoices and related data.
      await db.casInvoiceDetail.delete({});
      await db.casInvoice.delete({});
      await db.casInvoiceBatch.delete({});
      // Reset sequence numbers.
      await db.sequenceControl.delete({
        sequenceName: CAS_INVOICE_BATCH_SEQUENCE_NAME,
      });
      await db.sequenceControl.delete({
        sequenceName: CAS_INVOICE_SEQUENCE_NAME,
      });
    });

    it("Should create a new CAS invoice batch for a full-time receipt when there is a e-Cert receipt with no invoice associated.", async () => {
      // Arrange
      const casSupplier = await saveFakeCASSupplier(db, undefined, {
        initialValues: {
          supplierStatus: SupplierStatus.VerifiedManually,
        },
      });
      const student = await saveFakeStudent(db.dataSource, { casSupplier });
      // Created a full-time application with Federal and Provincial loans and grants
      // to ensure that only expected awards (BC grants) will have invoices generated.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              "CSLF",
              1000,
            ),
            createFakeDisbursementValue(
              DisbursementValueType.CanadaGrant,
              "CSGD",
              500,
            ),
            createFakeDisbursementValue(
              DisbursementValueType.BCLoan,
              "BCSL",
              901,
              {
                effectiveAmount: 900,
              },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "BCAG",
              351,
              { effectiveAmount: 350 },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "SBSD",
              201,
              { effectiveAmount: 200 },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.BCTotalGrant,
              "BCSG",
              350,
              { effectiveAmount: 350 },
            ),
          ],
        },
      );
      const [firstDisbursementSchedule] =
        application.currentAssessment.disbursementSchedules;
      const { provincial: provincialDisbursementReceipt } =
        await saveFakeDisbursementReceiptsFromDisbursementSchedule(
          db,
          firstDisbursementSchedule,
        );

      // Queued job.
      const mockedJob = mockBullJob<void>();

      // Act
      const result = await processor.processQueue(mockedJob.job);

      // Assert
      expect(result).toStrictEqual([
        "Batch created: SIMS-BATCH-1.",
        "Invoices created: 1.",
      ]);
      expect(
        mockedJob.containLogMessages([
          "Executing CAS invoices batches creation.",
          "Checking for pending receipts.",
          "Found 1 pending receipts.",
          `Creating invoice for receipt ID ${provincialDisbursementReceipt.id}.`,
          `Invoice SIMS-INVOICE-1-${casSupplier.supplierNumber} created for receipt ID ${provincialDisbursementReceipt.id}.`,
          `Created invoice detail for award BCAG(CR).`,
          `Created invoice detail for award BCAG(DR).`,
          `Created invoice detail for award SBSD(CR).`,
          `Created invoice detail for award SBSD(DR).`,
          `CAS invoices batches creation process executed.`,
        ]),
      ).toBe(true);
      // Assert the created batch on DB and its related data.
      const createdBatches = await db.casInvoiceBatch.find({
        select: {
          batchName: true,
          batchDate: true,
          approvalStatus: true,
          approvalStatusUpdatedBy: { id: true },
          approvalStatusUpdatedOn: true,
          casInvoices: {
            id: true,
            disbursementReceipt: {
              id: true,
            },
            casSupplier: {
              id: true,
            },
            invoiceNumber: true,
            invoiceStatus: true,
            invoiceStatusUpdatedOn: true,
            casInvoiceDetails: {
              id: true,
              valueAmount: true,
              casDistributionAccount: {
                id: true,
                operationCode: true,
                awardValueCode: true,
                offeringIntensity: true,
                distributionAccount: true,
              },
            },
          },
        },
        relations: {
          approvalStatusUpdatedBy: true,
          casInvoices: {
            disbursementReceipt: true,
            casSupplier: true,
            casInvoiceDetails: {
              casDistributionAccount: true,
            },
          },
        },
      });
      expect(createdBatches.length).toEqual(1);
      const [expectedBatch] = createdBatches;
      // Assert batch, invoices and its details.
      expect(expectedBatch).toEqual({
        batchName: "SIMS-BATCH-1",
        batchDate: expect.any(Date),
        approvalStatus: CASInvoiceBatchApprovalStatus.Pending,
        approvalStatusUpdatedOn: expect.any(Date),
        approvalStatusUpdatedBy: {
          id: systemUsersService.systemUser.id,
        },
        casInvoices: [
          {
            id: expect.any(Number),
            invoiceNumber: `SIMS-INVOICE-1-${casSupplier.supplierNumber}`,
            invoiceStatus: CASInvoiceStatus.Pending,
            invoiceStatusUpdatedOn: expect.any(Date),
            disbursementReceipt: {
              id: provincialDisbursementReceipt.id,
            },
            casSupplier: { id: casSupplier.id },
            casInvoiceDetails: expect.arrayContaining([
              {
                id: expect.any(Number),
                valueAmount: 350,
                casDistributionAccount: {
                  id: expect.any(Number),
                  awardValueCode: "BCAG",
                  offeringIntensity: "Full Time",
                  operationCode: "CR",
                  distributionAccount:
                    "100.CR.FULL-TIME.00000.0000.0000000.0000",
                },
              },
              {
                id: expect.any(Number),
                valueAmount: 350,
                casDistributionAccount: {
                  id: expect.any(Number),
                  awardValueCode: "BCAG",
                  offeringIntensity: "Full Time",
                  operationCode: "DR",
                  distributionAccount:
                    "101.DR.FULL-TIME.00000.0000.0000000.0000",
                },
              },
              {
                id: expect.any(Number),
                valueAmount: 200,
                casDistributionAccount: {
                  id: expect.any(Number),
                  awardValueCode: "SBSD",
                  offeringIntensity: "Full Time",
                  operationCode: "CR",
                  distributionAccount:
                    "104.CR.FULL-TIME.00000.0000.0000000.0000",
                },
              },
              {
                id: expect.any(Number),
                valueAmount: 200,
                casDistributionAccount: {
                  id: expect.any(Number),
                  awardValueCode: "SBSD",
                  offeringIntensity: "Full Time",
                  operationCode: "DR",
                  distributionAccount:
                    "105.DR.FULL-TIME.00000.0000.0000000.0000",
                },
              },
            ]),
          },
        ],
      });
      const currentInvoiceSequenceNumber = await db.sequenceControl.findOne({
        select: {
          sequenceNumber: true,
        },
        where: {
          sequenceName: CAS_INVOICE_SEQUENCE_NAME,
        },
      });
      expect(currentInvoiceSequenceNumber.sequenceNumber).toEqual("2");
    });
  },
);
