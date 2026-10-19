import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
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
  saveFakeInvoiceIntoBatchWithInvoiceDetails,
} from "@sims/test-utils";
import { SystemUsersService } from "@sims/services";
import {
  CASInvoiceStatus,
  DisbursementValueType,
  OfferingIntensity,
} from "@sims/sims-db";

describe("CASInvoiceBatchAESTController(e2e)-getCASInvoiceBatchSummaryTotals", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let systemUsersService: SystemUsersService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    systemUsersService = app.get(SystemUsersService);
    db = createE2EDataSources(dataSource);
  });

  it("Should get the batch processing summary and distribution totals when the batch has invoices in different statuses and offering intensities.", async () => {
    // Arrange
    const casInvoiceBatch = await db.casInvoiceBatch.save(
      createFakeCASInvoiceBatch({
        creator: systemUsersService.systemUser,
      }),
    );
    await Promise.all([
      // Full-time invoice sent to CAS.
      saveFakeInvoiceIntoBatchWithInvoiceDetails(
        db,
        {
          casInvoiceBatch,
          creator: systemUsersService.systemUser,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "BCAG",
              10,
              { effectiveAmount: 5 },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "SBSD",
              30,
              { effectiveAmount: 25 },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.BCTotalGrant,
              "BCSG",
              40,
              { effectiveAmount: 30 },
            ),
          ],
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          casInvoiceInitialValues: { invoiceStatus: CASInvoiceStatus.Sent },
        },
      ),
      // Part-time invoice requiring manual intervention.
      saveFakeInvoiceIntoBatchWithInvoiceDetails(
        db,
        {
          casInvoiceBatch,
          creator: systemUsersService.systemUser,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "BCAG",
              200,
              { effectiveAmount: 150 },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "SBSD",
              300,
              { effectiveAmount: 250 },
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
          casInvoiceInitialValues: {
            invoiceStatus: CASInvoiceStatus.ManualIntervention,
          },
        },
      ),
      // Part-time invoice resolved.
      saveFakeInvoiceIntoBatchWithInvoiceDetails(
        db,
        {
          casInvoiceBatch,
          creator: systemUsersService.systemUser,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "BCAG",
              60,
              { effectiveAmount: 50 },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.BCTotalGrant,
              "BCSG",
              60,
              { effectiveAmount: 50 },
            ),
          ],
        },
        {
          offeringIntensity: OfferingIntensity.partTime,
          casInvoiceInitialValues: {
            invoiceStatus: CASInvoiceStatus.Resolved,
          },
        },
      ),
      // Part-time invoice pending.
      saveFakeInvoiceIntoBatchWithInvoiceDetails(
        db,
        {
          casInvoiceBatch,
          creator: systemUsersService.systemUser,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.BCGrant,
              "SBSD",
              20,
              { effectiveAmount: 10 },
            ),
            createFakeDisbursementValue(
              DisbursementValueType.BCTotalGrant,
              "BCSG",
              20,
              { effectiveAmount: 10 },
            ),
          ],
        },
        {
          offeringIntensity: OfferingIntensity.partTime,
          casInvoiceInitialValues: { invoiceStatus: CASInvoiceStatus.Pending },
        },
      ),
    ]);
    const endpoint = `/aest/cas-invoice-batch/${casInvoiceBatch.id}/batch-summary-totals`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        processingSummary: {
          totalInvoices: 4,
          invoiceStatusCounts: [
            { invoiceStatus: CASInvoiceStatus.Pending, count: 1 },
            { invoiceStatus: CASInvoiceStatus.Sent, count: 1 },
            { invoiceStatus: CASInvoiceStatus.ManualIntervention, count: 1 },
            { invoiceStatus: CASInvoiceStatus.Resolved, count: 1 },
          ],
        },
        // Ordered by award value code, offering intensity (as declared in the
        // DB enum, part-time first) and operation code.
        awardAmounts: [
          {
            awardValueCode: "BCAG",
            offeringIntensity: OfferingIntensity.partTime,
            operationCode: "CR",
            total: 200,
          },
          {
            awardValueCode: "BCAG",
            offeringIntensity: OfferingIntensity.partTime,
            operationCode: "DR",
            total: 200,
          },
          {
            awardValueCode: "BCAG",
            offeringIntensity: OfferingIntensity.fullTime,
            operationCode: "CR",
            total: 5,
          },
          {
            awardValueCode: "BCAG",
            offeringIntensity: OfferingIntensity.fullTime,
            operationCode: "DR",
            total: 5,
          },
          {
            awardValueCode: "SBSD",
            offeringIntensity: OfferingIntensity.partTime,
            operationCode: "CR",
            total: 260,
          },
          {
            awardValueCode: "SBSD",
            offeringIntensity: OfferingIntensity.partTime,
            operationCode: "DR",
            total: 260,
          },
          {
            awardValueCode: "SBSD",
            offeringIntensity: OfferingIntensity.fullTime,
            operationCode: "CR",
            total: 25,
          },
          {
            awardValueCode: "SBSD",
            offeringIntensity: OfferingIntensity.fullTime,
            operationCode: "DR",
            total: 25,
          },
        ],
      });
  });

  it("Should get zeroed totals and no distribution totals when the batch has no invoices.", async () => {
    // Arrange
    const casInvoiceBatch = await db.casInvoiceBatch.save(
      createFakeCASInvoiceBatch({
        creator: systemUsersService.systemUser,
      }),
    );
    const endpoint = `/aest/cas-invoice-batch/${casInvoiceBatch.id}/batch-summary-totals`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        processingSummary: {
          totalInvoices: 0,
          invoiceStatusCounts: [
            { invoiceStatus: CASInvoiceStatus.Pending, count: 0 },
            { invoiceStatus: CASInvoiceStatus.Sent, count: 0 },
            { invoiceStatus: CASInvoiceStatus.ManualIntervention, count: 0 },
            { invoiceStatus: CASInvoiceStatus.Resolved, count: 0 },
          ],
        },
        awardAmounts: [],
      });
  });

  it("Should throw a HttpStatus Not Found (404) when the requested invoice batch does not exist.", async () => {
    // Arrange
    const endpoint = "/aest/cas-invoice-batch/999999/batch-summary-totals";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "CAS invoice batch with ID 999999 not found.",
        error: "Not Found",
      });
  });

  it("Should throw a HttpStatus Forbidden (403) error when an unauthorized Ministry user tries to get the invoice batch summary totals.", async () => {
    // Arrange
    const endpoint = "/aest/cas-invoice-batch/999999/batch-summary-totals";
    const token = await getAESTToken(AESTGroups.MOFOperations);

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
