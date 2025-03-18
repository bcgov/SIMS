import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeDisbursementValue,
  E2EDataSources,
  saveFakeInvoiceIntoBatchWithInvoiceDetails,
} from "@sims/test-utils";
import { createFakeCASInvoiceBatch } from "../../../../../../../libs/test-utils/src";
import { SystemUsersService } from "@sims/services";
import {
  CASInvoiceStatus,
  DisbursementValueType,
  OfferingIntensity,
  SupplierStatus,
  User,
} from "@sims/sims-db";

describe("CASInvoiceAESTController(e2e)-updateInvoiceToResolved", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let systemUsersService: SystemUsersService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    systemUsersService = app.get(SystemUsersService);
    db = createE2EDataSources(dataSource);
  });

  it(`Should resolve an invoice in ${CASInvoiceStatus.ManualIntervention} status for the provided invoice identifier.`, async () => {
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
        ],
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
        casSupplierInitialValues: {
          supplierStatus: SupplierStatus.VerifiedManually,
          supplierNumber: "222222",
        },
      },
    );
    casInvoice.invoiceStatus = CASInvoiceStatus.ManualIntervention;
    await db.casInvoice.save(casInvoice);
    const endpoint = `/aest/cas-invoice/${casInvoice.id}/resolve`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send()
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    const updatedCASInvoice = await db.casInvoice.findOne({
      select: {
        id: true,
        invoiceNumber: true,
        invoiceStatus: true,
        invoiceStatusUpdatedBy: { id: true },
        invoiceStatusUpdatedOn: true,
      },
      relations: { invoiceStatusUpdatedBy: true },
      where: { id: casInvoice.id },
    });
    const invoiceStatusUpdatedBy = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    expect(updatedCASInvoice).toEqual({
      id: casInvoice.id,
      invoiceNumber: casInvoice.invoiceNumber,
      invoiceStatus: CASInvoiceStatus.Resolved,
      invoiceStatusUpdatedBy: { id: invoiceStatusUpdatedBy.id } as User,
      invoiceStatusUpdatedOn: updatedCASInvoice.invoiceStatusUpdatedOn,
    });
  });

  it("Should throw a HttpStatus Not Found (404) error when the CAS invoice to resolve doesn't exist.", async () => {
    // Arrange
    const endpoint = "/aest/cas-invoice/99999999/resolve";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send()
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "CAS invoice not found.",
        error: "Not Found",
      });
  });

  it("Should throw a HttpStatus Forbidden (403) error when an unauthorized Ministry user tries to update the invoice.", async () => {
    // Arrange
    const endpoint = "/aest/cas-invoice/99999999/resolve";
    const token = await getAESTToken(AESTGroups.MOFOperations);
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send()
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
