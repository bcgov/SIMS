import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeCASInvoiceBatch,
  createFakeDisbursementValue,
  E2EDataSources,
  saveFakeInvoiceFromDisbursementReceipt,
  saveFakeInvoiceIntoBatchWithInvoiceDetails,
} from "@sims/test-utils";
import { SystemUsersService } from "@sims/services";
import {
  CASInvoiceStatus,
  DisbursementValueType,
  OfferingIntensity,
  SupplierStatus,
} from "@sims/sims-db";
import { CASInvoiceAPIOutDTO } from "apps/api/src/route-controllers/cas-invoice/models/cas-invoice.dto";
import { addDays } from "@sims/utilities";
import { Between } from "typeorm";

/**
 * Use a period that will never be reached to delete all existing invoice batches
 * and allow the retrieval of invoice batches to be tested.
 */
const CAS_INVOICE_STATUS_LAST_UPDATED_ON_START_DATE = new Date("2200-01-01");
const CAS_INVOICE_STATUS_LAST_UPDATED_ON_END_DATE = new Date("2200-02-01");

describe("CASInvoiceAESTController(e2e)-getInvoices", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let systemUsersService: SystemUsersService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    systemUsersService = app.get(SystemUsersService);
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    // Delete existing CAS invoices and invoice details created between the CAS_INVOICE_STATUS_LAST_UPDATED_ON_START_DATE and the CAS_INVOICE_STATUS_LAST_UPDATED_ON_END_DATE dates.
    const invoicesToDelete = await db.casInvoice.find({
      select: { id: true },
      where: {
        invoiceStatusUpdatedOn: Between(
          CAS_INVOICE_STATUS_LAST_UPDATED_ON_START_DATE,
          CAS_INVOICE_STATUS_LAST_UPDATED_ON_END_DATE,
        ),
      },
    });
    for (const invoice of invoicesToDelete) {
      await db.casInvoiceDetail.delete({
        casInvoice: invoice,
      });
    }
    await db.casInvoice.delete({
      invoiceStatusUpdatedOn: Between(
        CAS_INVOICE_STATUS_LAST_UPDATED_ON_START_DATE,
        CAS_INVOICE_STATUS_LAST_UPDATED_ON_END_DATE,
      ),
    });
    // Delete all existing invoice batches.
    await db.casInvoiceBatch.delete({});
  });

  it(`Should be able to get invoices for the first page in a paginated result with a limit of two per page with ${CASInvoiceStatus.ManualIntervention} status in the descending order.`, async () => {
    // Arrange
    // Create CAS invoice batch.
    const casInvoiceBatch = await db.casInvoiceBatch.save(
      createFakeCASInvoiceBatch({
        creator: systemUsersService.systemUser,
      }),
    );
    // Creates part-time application with receipts, and invoices details.
    const casInvoice = await saveFakeInvoiceIntoBatchWithInvoiceDetails(
      db,
      {
        casInvoiceBatch,
        creator: systemUsersService.systemUser,
        // Part-time BC grants.
        disbursementValues: [
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            200,
            {
              effectiveAmount: 150,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "SBSD",
            300,
            {
              effectiveAmount: 250,
            },
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCTotalGrant,
            "BCSG",
            500,
            { effectiveAmount: 400 },
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        casSupplierInitialValues: {
          supplierStatus: SupplierStatus.VerifiedManually,
          supplierNumber: "222222",
        },
        casInvoiceInitialValues: {
          invoiceStatusUpdatedOn: addDays(
            5,
            CAS_INVOICE_STATUS_LAST_UPDATED_ON_START_DATE,
          ),
        },
      },
    );
    const disbursementReceipt = casInvoice.disbursementReceipt;
    const casSupplier = casInvoice.casSupplier;
    await saveFakeInvoiceFromDisbursementReceipt(
      db,
      {
        casInvoiceBatch,
        creator: systemUsersService.systemUser,
        provincialDisbursementReceipt: disbursementReceipt,
        casSupplier,
      },
      {
        casInvoiceInitialValues: {
          invoiceStatus: CASInvoiceStatus.ManualIntervention,
          invoiceStatusUpdatedOn: addDays(
            2,
            CAS_INVOICE_STATUS_LAST_UPDATED_ON_START_DATE,
          ),
        },
      },
    );
    const thirdInvoice = await saveFakeInvoiceFromDisbursementReceipt(
      db,
      {
        casInvoiceBatch,
        creator: systemUsersService.systemUser,
        provincialDisbursementReceipt: disbursementReceipt,
        casSupplier,
      },
      {
        casInvoiceInitialValues: {
          invoiceStatus: CASInvoiceStatus.ManualIntervention,
          invoiceStatusUpdatedOn: addDays(
            10,
            CAS_INVOICE_STATUS_LAST_UPDATED_ON_START_DATE,
          ),
        },
      },
    );
    const fourthInvoice = await saveFakeInvoiceFromDisbursementReceipt(
      db,
      {
        casInvoiceBatch,
        creator: systemUsersService.systemUser,
        provincialDisbursementReceipt: disbursementReceipt,
        casSupplier,
      },
      {
        casInvoiceInitialValues: {
          invoiceStatus: CASInvoiceStatus.ManualIntervention,
          invoiceStatusUpdatedOn: addDays(
            20,
            CAS_INVOICE_STATUS_LAST_UPDATED_ON_START_DATE,
          ),
        },
      },
    );
    const endpoint = `/aest/cas-invoice?page=0&pageLimit=2&sortField=invoiceStatusUpdatedOn&sortOrder=DESC&invoiceStatusSearch=${CASInvoiceStatus.ManualIntervention}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    const invoices = response.body.results as CASInvoiceAPIOutDTO[];
    expect(invoices).toStrictEqual([
      {
        errors: null,
        id: fourthInvoice.id,
        invoiceBatchName: fourthInvoice.casInvoiceBatch.batchName,
        invoiceNumber: fourthInvoice.invoiceNumber,
        invoiceStatusUpdatedOn:
          fourthInvoice.invoiceStatusUpdatedOn.toISOString(),
        supplierNumber: fourthInvoice.casSupplier.supplierNumber,
      },
      {
        errors: null,
        id: thirdInvoice.id,
        invoiceBatchName: thirdInvoice.casInvoiceBatch.batchName,
        invoiceNumber: thirdInvoice.invoiceNumber,
        invoiceStatusUpdatedOn:
          thirdInvoice.invoiceStatusUpdatedOn.toISOString(),
        supplierNumber: thirdInvoice.casSupplier.supplierNumber,
      },
    ]);
  });

  it("Should throw a HttpStatus Bad Request (400) error when the invoice status is invalid.", async () => {
    // Arrange
    const endpoint =
      "/aest/cas-invoice?page=0&pageLimit=10&sortField=invoiceStatusUpdatedOn&sortOrder=DESC&invoiceStatusSearch=SomeInvalidStatus";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "invoiceStatusSearch must be one of the following values: Pending, Sent, Manual intervention, Resolved",
        ],
        error: "Bad Request",
      });
  });

  it("Should throw a HttpStatus Bad Request (400) error when the sortField is invalid.", async () => {
    // Arrange
    const endpoint = `/aest/cas-invoice?page=0&pageLimit=10&sortField=SomeInvalidField&sortOrder=DESC&invoiceStatusSearch=Pending`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          "sortField must be one of the following values: invoiceStatusUpdatedOn",
        ],
        error: "Bad Request",
      });
  });

  it("Should throw a HttpStatus Forbidden (403) error when an unauthorized Ministry user tries to get the invoices.", async () => {
    // Arrange
    const endpoint = "/aest/cas-invoice";
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
