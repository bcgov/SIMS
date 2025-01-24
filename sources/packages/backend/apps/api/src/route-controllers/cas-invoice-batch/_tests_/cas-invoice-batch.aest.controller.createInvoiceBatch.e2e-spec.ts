import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeDisbursementReceipt,
  createFakeDisbursementValue,
  saveFakeApplicationDisbursements,
  saveFakeCASSupplier,
  saveFakeDisbursementReceiptsFromDisbursementSchedule,
  saveFakeStudent,
} from "@sims/test-utils";
import { DisbursementValueType, SupplierStatus } from "@sims/sims-db";

describe("CASInvoiceBatchAESTController(e2e)-createInvoiceBatch", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  // TODO: Test the GET only.
  it.only("Should create a new CAS invoice batch when there are e-Cert receipts with no invoice associated.", async () => {
    // Arrange
    const casSupplier = await saveFakeCASSupplier(db, undefined, {
      initialValues: {
        supplierStatus: SupplierStatus.VerifiedManually,
      },
    });
    const student = await saveFakeStudent(db.dataSource, { casSupplier });
    const application = await saveFakeApplicationDisbursements(db.dataSource, {
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
        createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 901, {
          effectiveAmount: 900,
        }),
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
    });
    const [firstDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    await saveFakeDisbursementReceiptsFromDisbursementSchedule(
      db,
      firstDisbursementSchedule,
    );

    const endpoint = `/aest/cas-invoice-batch`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED);
  });
});
