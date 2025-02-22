import { INestApplication } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
import {
  SupplierStatus,
  DisbursementValueType,
  CASInvoiceBatchApprovalStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeDisbursementValue,
  createFakeCASInvoiceBatch,
  saveFakeInvoiceIntoBatchWithInvoiceDetails,
} from "@sims/test-utils";
import { getPSTPDTDateTime, QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import { CASSendInvoicesScheduler } from "../cas-send-invoices.scheduler";

const CAS_INVOICE_BATCH_SEQUENCE_NAME = "CAS_INVOICE_BATCH";
const CAS_INVOICE_SEQUENCE_NAME = "CAS_INVOICE";

describe(describeProcessorRootTest(QueueNames.CASSendInvoices), () => {
  let app: INestApplication;
  let processor: CASSendInvoicesScheduler;
  let db: E2EDataSources;
  let systemUsersService: SystemUsersService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    systemUsersService = nestApplication.get(SystemUsersService);
    db = createE2EDataSources(dataSource);
    // Processor under test.
    processor = app.get(CASSendInvoicesScheduler);
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

  it.only("Should send invoices.", async () => {
    // Create invoice batch to generate the report.
    const casInvoiceBatch = await db.casInvoiceBatch.save(
      createFakeCASInvoiceBatch(
        {
          creator: systemUsersService.systemUser,
        },
        {
          initialValue: {
            approvalStatus: CASInvoiceBatchApprovalStatus.Approved,
          },
        },
      ),
    );
    // Creates full-time application with receipts, and invoices details.
    const fullTimeInvoice = await saveFakeInvoiceIntoBatchWithInvoiceDetails(
      db,
      {
        casInvoiceBatch,
        creator: systemUsersService.systemUser,
        // Full-time BC grants.
        disbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            10,
            {
              effectiveAmount: 5,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BGPD",
            20,
            {
              effectiveAmount: 15,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "SBSD",
            30,
            {
              effectiveAmount: 25,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCTotalGrant,
            "BCSG",
            60,
            { effectiveAmount: 45 },
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        casSupplierInitialValues: {
          supplierStatus: SupplierStatus.VerifiedManually,
          supplierNumber: "111111",
        },
      },
    );
    // Creating variables to provide easy access to some nested values.
    // Full-time related variables.
    fullTimeInvoice.disbursementReceipt.disbursementSchedule.studentAssessment
      .application.student;
    fullTimeInvoice.disbursementReceipt.disbursementSchedule.documentNumber.toString();
    getPSTPDTDateTime(fullTimeInvoice.disbursementReceipt.createdAt);

    // Queued job.
    const mockedJob = mockBullJob<void>();

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    expect(result).toStrictEqual(["Process finalized with success."]);
    expect(mockedJob.containLogMessages(["CAS send invoices executed."])).toBe(
      true,
    );
  });
});
