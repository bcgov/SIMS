import { INestApplication } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
import {
  SupplierStatus,
  CASInvoiceBatchApprovalStatus,
  OfferingIntensity,
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

  it("Should send invoices to CAS when there are pending invoices.", async () => {
    //Arrange
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
        casInvoiceBatch: { id: casInvoiceBatch.id },
      },
    });
    expect(result).toStrictEqual(["Process finalized with success."]);
    expect(
      mockedJob.containLogMessages([
        "Checking for pending invoices.",
        "Executing 1 pending invoice(s) sent to CAS.",
        `Processing pending invoice: ${casInvoice.invoiceNumber}.`,
        "Invoice sent to CAS SUCCEEDED.",
      ]),
    ).toBe(true);
  });

  it("Should contain log 'No pending invoices found' when there are no pending invoices found.  ", async () => {
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
      "Error(s): 0, Warning(s): 1, Info: 9",
    ]);

    // Assert DB was updated.
    const updatedCASInvoiceBatch = await db.casInvoice.findOne({
      select: {
        id: true,
        errors: true,
      },
      where: {
        casInvoiceBatch: { id: casInvoiceBatch.id },
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
        casInvoiceBatch: { id: casInvoiceBatch.id },
      },
    });
    expect(
      mockedJob.containLogMessages([
        "Checking for pending invoices.",
        "Executing 1 pending invoice(s) sent to CAS.",
        `Processing pending invoice: ${casInvoice.invoiceNumber}.`,
        "Unexpected error while sending invoice to CAS.",
      ]),
    ).toBe(true);
  });
});
