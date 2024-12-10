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
  saveFakeCASSupplier,
  saveFakeStudent,
} from "@sims/test-utils";
import { SupplierStatus } from "@sims/sims-db";

describe("CASSupplierAESTController(e2e)-retryCASSupplier", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should throw Unprocessable Entity Error when retry CAS supplier is requested for a student who already has a CAS supplier in Pending supplier verification status.", async () => {
    // Arrange
    // Create a CAS Supplier for the student with Pending supplier verification status.
    const casSupplier = await saveFakeCASSupplier(db, undefined, {
      initialValues: {
        supplierStatus: SupplierStatus.PendingSupplierVerification,
        status: "ACTIVE",
      },
    });
    const student = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: {
        casSupplier: casSupplier,
      },
    });
    const endpoint = `/aest/cas-supplier/retry/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "There is already a CAS Supplier for this student in Pending supplier verification status.",
        error: "Unprocessable Entity",
      });
  });

  it("Should create CAS supplier when retry CAS supplier is requested for a student who does not have a latest CAS supplier in Pending supplier verification status.", async () => {
    // Arrange
    // Create a CAS Supplier for the student with Manual Intervention status.
    const casSupplier = await saveFakeCASSupplier(db, undefined, {
      initialValues: {
        supplierStatus: SupplierStatus.ManualIntervention,
        status: "ACTIVE",
      },
    });
    const student = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: {
        casSupplier: casSupplier,
      },
    });
    const endpoint = `/aest/cas-supplier/retry/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    let responseCasSupplierId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        responseCasSupplierId = +response.body.id;
        expect(responseCasSupplierId).toEqual(expect.any(Number));
      });

    const casSuppliers = await db.casSupplier.findOne({
      select: {
        id: true,
        supplierStatus: true,
        isValid: true,
      },
      where: {
        id: responseCasSupplierId,
      },
      order: {
        createdAt: "DESC",
      },
    });

    expect(casSuppliers).toEqual({
      id: responseCasSupplierId,
      supplierStatus: SupplierStatus.PendingSupplierVerification,
      isValid: false,
    });
  });

  it("Should throw Not Found Error when a student is not found.", async () => {
    // Arrange
    const endpoint = `/aest/cas-supplier/retry/99999`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Student not found.",
        error: "Not Found",
      });
  });
});
