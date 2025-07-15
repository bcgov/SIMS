import { INestApplication } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
import {
  SupplierStatus,
  CASInvoiceBatchApprovalStatus,
  OfferingIntensity,
  CASInvoiceStatus,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeCASInvoiceBatch,
  saveFakeInvoiceIntoBatchWithInvoiceDetails,
} from "@sims/test-utils";
import { CustomNamedError, QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
  mockBullJob,
} from "../../../../../test/helpers";
import { CASSendInvoicesScheduler } from "../cas-send-invoices.scheduler";
import { CAS_BAD_REQUEST } from "@sims/integrations/constants";
import { CASService } from "@sims/integrations/cas";
import { resetCASServiceMock } from "../../../../../test/helpers/mock-utils/cas-service.mock";
import { CASIntegrationQueueInDTO } from "../models/cas-integration.dto";

const CAS_INVOICE_BATCH_SEQUENCE_NAME = "CAS_INVOICE_BATCH";
const CAS_INVOICE_SEQUENCE_NAME = "CAS_INVOICE";

describe(describeProcessorRootTest(QueueNames.CASSendInvoices), () => {
  let app: INestApplication;
  let processor: CASSendInvoicesScheduler;
  let db: E2EDataSources;
  let systemUsersService: SystemUsersService;
  let casServiceMock: CASService;

  beforeAll(async () => {
    const {
      nestApplication,
      dataSource,
      casServiceMock: casServiceMockFromAppModule,
    } = await createTestingAppModule();
    app = nestApplication;
    systemUsersService = nestApplication.get(SystemUsersService);
    db = createE2EDataSources(dataSource);
    casServiceMock = casServiceMockFromAppModule;
    // Processor under test.
    processor = app.get(CASSendInvoicesScheduler);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    resetCASServiceMock(casServiceMock);
    // Delete all existing invoices and related data.
    await db.casInvoiceDetail.createQueryBuilder().delete().execute();
    await db.casInvoice.createQueryBuilder().delete().execute();
    await db.casInvoiceBatch.createQueryBuilder().delete().execute();
    // Reset sequence numbers.
    await db.sequenceControl.delete({
      sequenceName: CAS_INVOICE_BATCH_SEQUENCE_NAME,
    });
    await db.sequenceControl.delete({
      sequenceName: CAS_INVOICE_SEQUENCE_NAME,
    });
  });

  it("Should send invoices to CAS when there are pending invoices.", async () => {
    //Arrange
    // Create invoice batch to generate the report.
    const casInvoiceBatchId = await createFakeCASInvoiceBatchHelper();
    // Queued job.
    const mockedJob = mockBullJob<CASIntegrationQueueInDTO>({
      pollingRecordsLimit: 1,
    });

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    const casInvoice = await db.casInvoice.findOne({
      select: {
        id: true,
        invoiceNumber: true,
      },
      where: {
        casInvoiceBatch: { id: casInvoiceBatchId },
      },
    });
    expect(result).toStrictEqual(["Process finalized with success."]);
    expect(
      mockedJob.containLogMessages([
        "Checking for pending invoices.",
        "Found 1 pending invoice(s) to be sent to CAS.",
        `Processing pending invoice: ${casInvoice.invoiceNumber}.`,
        "Invoice sent to CAS SUCCEEDED.",
      ]),
    ).toBe(true);

    // Assert invoice status, date sent and status updated date are updated.
    const updatedCASInvoice = await db.casInvoice.findOne({
      select: {
        invoiceStatus: true,
        invoiceStatusUpdatedOn: true,
        dateSent: true,
      },
      where: { id: casInvoice.id },
    });
    expect(updatedCASInvoice).toEqual({
      invoiceStatus: CASInvoiceStatus.Sent,
      invoiceStatusUpdatedOn: expect.any(Date),
      dateSent: expect.any(Date),
    });
  });

  it("Should contain log 'No pending invoices found' when there are no pending invoices found.", async () => {
    // Arrange
    // Queued job.
    const mockedJob = mockBullJob<CASIntegrationQueueInDTO>({
      pollingRecordsLimit: 1,
    });

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    expect(result).toStrictEqual(["Process finalized with success."]);
    expect(
      mockedJob.containLogMessages([
        "Checking for pending invoices.",
        "No pending invoices found.",
      ]),
    ).toBe(true);
  });

  it("Should capture the error in invoices when sent to CAS and known errors are returned.", async () => {
    //Arrange
    // Create invoice batch to generate the report.
    const casInvoiceBatchId = await createFakeCASInvoiceBatchHelper();
    // Configure CAS mock to return a custom named Bad Request error.
    casServiceMock.sendInvoice = jest.fn().mockImplementation(() => {
      throw new CustomNamedError("CAS Bad Request Errors", CAS_BAD_REQUEST, [
        "[036] GL Date is blank, not in an open period or formatted incorrectly.",
      ]);
    });
    // Queued job.
    const mockedJob = mockBullJob<CASIntegrationQueueInDTO>({
      pollingRecordsLimit: 1,
    });

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    expect(result).toStrictEqual([
      "Process finalized with success.",
      "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      "Error(s): 0, Warning(s): 1, Info: 8",
    ]);

    // Assert DB was updated.
    const updatedCASInvoiceBatch = await db.casInvoice.findOne({
      select: {
        id: true,
        errors: true,
      },
      where: {
        casInvoiceBatch: { id: casInvoiceBatchId },
      },
    });

    expect(updatedCASInvoiceBatch.errors).toStrictEqual([
      "[036] GL Date is blank, not in an open period or formatted incorrectly.",
    ]);
  });

  it("Should throw error when an unexpected error happen during pending invoice sent to CAS.", async () => {
    // Arrange
    // Create mock where it will throw an error.
    casServiceMock.sendInvoice = jest
      .fn()
      .mockRejectedValueOnce("Unknown error");

    // Create invoice batch to generate the report.
    const casInvoiceBatchId = await createFakeCASInvoiceBatchHelper();
    // Queued job.
    const mockedJob = mockBullJob<CASIntegrationQueueInDTO>({
      pollingRecordsLimit: 1,
    });

    // Act
    await expect(processor.processQueue(mockedJob.job)).rejects.toStrictEqual(
      new Error(
        "One or more errors were reported during the process, please see logs for details.",
      ),
    );

    // Assert
    const casInvoice = await db.casInvoice.findOne({
      select: {
        id: true,
        invoiceNumber: true,
      },
      where: {
        casInvoiceBatch: { id: casInvoiceBatchId },
      },
    });
    expect(
      mockedJob.containLogMessages([
        "Checking for pending invoices.",
        "Found 1 pending invoice(s) to be sent to CAS.",
        `Processing pending invoice: ${casInvoice.invoiceNumber}.`,
        "Unexpected error while sending invoice to CAS.",
      ]),
    ).toBe(true);
  });

  it("Should contain log 'No pending invoices found' when there are pending invoices found and the invoice batch is in Rejected status.  ", async () => {
    // Arrange
    // Create invoice batch to generate the report.
    const casInvoiceBatchId = await createFakeCASInvoiceBatchHelper(
      CASInvoiceBatchApprovalStatus.Rejected,
    );
    // Queued job.
    const mockedJob = mockBullJob<CASIntegrationQueueInDTO>({
      pollingRecordsLimit: 1,
    });

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    expect(result).toStrictEqual(["Process finalized with success."]);
    const casInvoice = await db.casInvoice.findOne({
      select: {
        id: true,
        invoiceStatus: true,
      },
      where: {
        casInvoiceBatch: {
          id: casInvoiceBatchId,
        },
      },
    });
    expect(casInvoice.invoiceStatus).toBe(CASInvoiceStatus.Pending);
    expect(
      mockedJob.containLogMessages([
        "Checking for pending invoices.",
        "No pending invoices found.",
      ]),
    ).toBe(true);
  });

  it("Should send invoices to CAS when there are pending invoices.", async () => {
    //Arrange
    // Create invoice batch to generate the report.
    const casInvoiceBatchId = await createFakeCASInvoiceBatchHelper();
    // Queued job.
    const mockedJob = mockBullJob<CASIntegrationQueueInDTO>({
      pollingRecordsLimit: 1,
    });

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    const casInvoice = await db.casInvoice.findOne({
      select: {
        id: true,
        invoiceNumber: true,
      },
      where: {
        casInvoiceBatch: { id: casInvoiceBatchId },
      },
    });
    expect(result).toStrictEqual(["Process finalized with success."]);
    expect(
      mockedJob.containLogMessages([
        "Checking for pending invoices.",
        "Found 1 pending invoice(s) to be sent to CAS.",
        `Processing pending invoice: ${casInvoice.invoiceNumber}.`,
        "Invoice sent to CAS SUCCEEDED.",
      ]),
    ).toBe(true);
  });

  it("Should return 'Duplicate Submission' message when the invoice sent to CAS was already sent and it is in the Pending status.", async () => {
    //Arrange
    // Create invoice batch to generate the report.
    const casInvoiceBatchId = await createFakeCASInvoiceBatchHelper();
    // Configure CAS mock to return a custom named Bad Request error.
    casServiceMock.sendInvoice = jest.fn(() =>
      Promise.resolve({
        casReturnedMessages: ["Duplicate Submission"],
      }),
    );
    // Queued job.
    const mockedJob = mockBullJob<CASIntegrationQueueInDTO>({
      pollingRecordsLimit: 1,
    });

    // Act
    const result = await processor.processQueue(mockedJob.job);

    // Assert
    const invoice = await db.casInvoice.findOne({
      select: {
        id: true,
        invoiceNumber: true,
      },
      where: {
        casInvoiceBatch: { id: casInvoiceBatchId },
      },
    });
    expect(result).toStrictEqual([
      "Process finalized with success.",
      "Attention, process finalized with success but some errors and/or warnings messages may require some attention.",
      "Error(s): 0, Warning(s): 1, Info: 7",
    ]);
    expect(
      mockedJob.containLogMessages([
        "Checking for pending invoices.",
        "Found 1 pending invoice(s) to be sent to CAS.",
        `Invoice ${invoice.invoiceNumber} sent to CAS was considered successful but returned additional message(s): Duplicate Submission.`,
      ]),
    ).toBe(true);
  });

  /**
   * Helper method to create fake invoice batch.
   * @param db data source.
   * @param systemUsersService system users service.
   * @param casInvoiceBatchApprovalStatus invoice batch approval status.
   * @returns cas invoice batch id.
   */
  async function createFakeCASInvoiceBatchHelper(
    casInvoiceBatchApprovalStatus?: CASInvoiceBatchApprovalStatus,
  ) {
    const casInvoiceBatch = await db.casInvoiceBatch.save(
      createFakeCASInvoiceBatch(
        {
          creator: systemUsersService.systemUser,
        },
        {
          initialValue: {
            approvalStatus:
              casInvoiceBatchApprovalStatus ??
              CASInvoiceBatchApprovalStatus.Approved,
          },
        },
      ),
    );
    // Creates full-time application with receipts, and invoices details.
    await saveFakeInvoiceIntoBatchWithInvoiceDetails(
      db,
      {
        casInvoiceBatch,
        creator: systemUsersService.systemUser,
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        casSupplierInitialValues: {
          supplierStatus: SupplierStatus.VerifiedManually,
          supplierNumber: "111111",
        },
      },
    );
    return casInvoiceBatch.id;
  }
});
