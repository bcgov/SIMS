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
  saveFakeInvoiceIntoBatchWithInvoiceDetails,
} from "@sims/test-utils";
import { SystemUsersService } from "@sims/services";
import { parse } from "papaparse";
import {
  DisbursementValueType,
  OfferingIntensity,
  SupplierStatus,
} from "@sims/sims-db";
import { getPSTPDTDateTime } from "@sims/utilities";

describe("CASInvoiceBatchAESTController(e2e)-getCASInvoiceBatchReport", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let systemUsersService: SystemUsersService;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    systemUsersService = app.get(SystemUsersService);
    db = createE2EDataSources(dataSource);
  });

  it("Should generate an invoice batch report with part-time and full-time invoices when the batch exists.", async () => {
    // Arrange
    // Create invoice batch to generate the report.
    const casInvoiceBatch = await db.casInvoiceBatch.save(
      createFakeCASInvoiceBatch({
        creator: systemUsersService.systemUser,
      }),
    );
    // Creates full-time application with receipts, and invoices details.
    const fullTimeInvoicePromise = saveFakeInvoiceIntoBatchWithInvoiceDetails(
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
    // Creates part-time application with receipts, and invoices details.
    const partTimeInvoicePromise = saveFakeInvoiceIntoBatchWithInvoiceDetails(
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
      },
    );
    const [fullTimeInvoice, partTimeInvoice] = await Promise.all([
      fullTimeInvoicePromise,
      partTimeInvoicePromise,
    ]);
    // Creating variables to provide easy access to some nested values.
    // Full-time related variables.
    const fullTimeStudent =
      fullTimeInvoice.disbursementReceipt.disbursementSchedule.studentAssessment
        .application.student;
    const fullTimeDocumentNumber =
      fullTimeInvoice.disbursementReceipt.disbursementSchedule.documentNumber.toString();
    const fullTimeGLDate = getPSTPDTDateTime(
      fullTimeInvoice.disbursementReceipt.createdAt,
    );
    // Part-time related variables.
    const partTimeStudent =
      partTimeInvoice.disbursementReceipt.disbursementSchedule.studentAssessment
        .application.student;
    const partTimeDocumentNumber =
      partTimeInvoice.disbursementReceipt.disbursementSchedule.documentNumber.toString();
    const partTimeGLDate = getPSTPDTDateTime(
      partTimeInvoice.disbursementReceipt.createdAt.toISOString(),
    );

    const endpoint = `/aest/cas-invoice-batch/${casInvoiceBatch.id}/report`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const fileContent = response.request.res["text"];
        const parsedResult = parse(fileContent, {
          header: true,
        });
        expect(parsedResult.data).toEqual([
          {
            "Invoice Number": fullTimeInvoice.invoiceNumber,
            "Given Names": fullTimeStudent.user.firstName,
            "Last Name": fullTimeStudent.user.lastName,
            SIN: fullTimeStudent.sinValidation.sin,
            "Supplier Number": "111111",
            "Document Number": fullTimeDocumentNumber,
            "GL Date": fullTimeGLDate,
            "Award Type": "BCAG",
            "CR Amount": "5",
            "CR Account": "BCAG.CR.FULL-TIME.0000000000000000000000",
            "DR Amount": "5",
            "DR Account": "BCAG.DR.FULL-TIME.0000000000000000000000",
          },
          {
            "Invoice Number": fullTimeInvoice.invoiceNumber,
            "Given Names": fullTimeStudent.user.firstName,
            "Last Name": fullTimeStudent.user.lastName,
            SIN: fullTimeStudent.sinValidation.sin,
            "Supplier Number": "111111",
            "Document Number": fullTimeDocumentNumber,
            "GL Date": fullTimeGLDate,
            "Award Type": "BGPD",
            "CR Amount": "15",
            "CR Account": "BGPD.CR.FULL-TIME.0000000000000000000000",
            "DR Amount": "15",
            "DR Account": "BGPD.DR.FULL-TIME.0000000000000000000000",
          },
          {
            "Invoice Number": fullTimeInvoice.invoiceNumber,
            "Given Names": fullTimeStudent.user.firstName,
            "Last Name": fullTimeStudent.user.lastName,
            SIN: fullTimeStudent.sinValidation.sin,
            "Supplier Number": "111111",
            "Document Number": fullTimeDocumentNumber,
            "GL Date": fullTimeGLDate,
            "Award Type": "SBSD",
            "CR Amount": "25",
            "CR Account": "SBSD.CR.FULL-TIME.0000000000000000000000",
            "DR Amount": "25",
            "DR Account": "SBSD.DR.FULL-TIME.0000000000000000000000",
          },
          {
            "Invoice Number": partTimeInvoice.invoiceNumber,
            "Given Names": partTimeStudent.user.firstName,
            "Last Name": partTimeStudent.user.lastName,
            SIN: partTimeStudent.sinValidation.sin,
            "Supplier Number": "222222",
            "Document Number": partTimeDocumentNumber,
            "GL Date": partTimeGLDate,
            "Award Type": "BCAG",
            "CR Amount": "150",
            "CR Account": "BCAG.CR.PART-TIME.0000000000000000000000",
            "DR Amount": "150",
            "DR Account": "BCAG.DR.PART-TIME.0000000000000000000000",
          },
          {
            "Invoice Number": partTimeInvoice.invoiceNumber,
            "Given Names": partTimeStudent.user.firstName,
            "Last Name": partTimeStudent.user.lastName,
            SIN: partTimeStudent.sinValidation.sin,
            "Supplier Number": "222222",
            "Document Number": partTimeDocumentNumber,
            "GL Date": partTimeGLDate,
            "Award Type": "SBSD",
            "CR Amount": "250",
            "CR Account": "SBSD.CR.PART-TIME.0000000000000000000000",
            "DR Amount": "250",
            "DR Account": "SBSD.DR.PART-TIME.0000000000000000000000",
          },
        ]);
      });
  });

  it("Should throw a HttpStatus Not Found (404) when the requested invoice batch does not exist.", async () => {
    // Arrange
    const endpoint = "/aest/cas-invoice-batch/999/report";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "CAS invoice batch with ID 999 not found.",
        error: "Not Found",
      });
  });

  it("Should throw a HttpStatus Forbidden (403) error when an unauthorized Ministry user tries to get the invoice batch report.", async () => {
    // Arrange
    const endpoint = "/aest/cas-invoice-batch/999/report";
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
