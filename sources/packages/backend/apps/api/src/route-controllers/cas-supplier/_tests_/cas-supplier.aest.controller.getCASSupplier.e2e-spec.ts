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
} from "@sims/test-utils";
import { SupplierStatus } from "@sims/sims-db";

describe("CASSupplierAESTController(e2e)-getCASSuppliers", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get all the CAS suppliers for a student when CAS suppliers info is requested for a student.", async () => {
    // Arrange
    const savedCASSupplier1 = await saveFakeCASSupplier(db);
    const student = savedCASSupplier1.student;
    const savedCASSupplier2 = await saveFakeCASSupplier(
      db,
      { student },
      { initialValues: { supplierStatus: SupplierStatus.VerifiedManually } },
    );

    const endpoint = `/aest/cas-supplier/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        items: [
          {
            id: savedCASSupplier2.id,
            dateCreated: savedCASSupplier2.createdAt.toISOString(),
            supplierNumber: savedCASSupplier2.supplierNumber,
            supplierProtected: null,
            supplierStatus: savedCASSupplier2.supplierStatus,
            isValid: savedCASSupplier2.isValid,
            supplierSiteCode:
              savedCASSupplier2.supplierAddress.supplierSiteCode,
            errors: null,
          },
          {
            id: savedCASSupplier1.id,
            dateCreated: savedCASSupplier1.createdAt.toISOString(),
            supplierNumber: savedCASSupplier1.supplierNumber,
            supplierProtected: savedCASSupplier1.supplierProtected,
            supplierStatus: savedCASSupplier1.supplierStatus,
            isValid: savedCASSupplier1.isValid,
            supplierSiteCode:
              savedCASSupplier1.supplierAddress.supplierSiteCode,
            siteStatus: savedCASSupplier1.supplierAddress.status,
            addressLine1: savedCASSupplier1.supplierAddress.addressLine1,
            siteProtected: savedCASSupplier1.supplierAddress.siteProtected,
            errors: null,
          },
        ],
      });
  });

  it("Should get CAS supplier with and without error for a student when CAS suppliers info is requested for a student.", async () => {
    // Arrange
    const savedCASSupplier1 = await saveFakeCASSupplier(db);
    const student = savedCASSupplier1.student;
    const savedCASSupplier2 = await saveFakeCASSupplier(
      db,
      { student },
      {
        initialValues: {
          supplierStatus: SupplierStatus.ManualIntervention,
          errors: [
            "[0034] SIN is already in use.",
            "[9999] Duplicate Supplier , Reason: [0065]- Possible duplicate exists, please use online form",
          ],
        },
      },
    );

    const endpoint = `/aest/cas-supplier/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        items: [
          {
            id: savedCASSupplier2.id,
            dateCreated: savedCASSupplier2.createdAt.toISOString(),
            supplierNumber: savedCASSupplier2.supplierNumber,
            supplierProtected: true,
            supplierStatus: savedCASSupplier2.supplierStatus,
            isValid: savedCASSupplier2.isValid,
            supplierSiteCode:
              savedCASSupplier2.supplierAddress.supplierSiteCode,
            siteStatus: savedCASSupplier2.supplierAddress.status,
            addressLine1: savedCASSupplier2.supplierAddress.addressLine1,
            siteProtected: savedCASSupplier2.supplierAddress.siteProtected,
            errors: savedCASSupplier2.errors,
          },
          {
            id: savedCASSupplier1.id,
            dateCreated: savedCASSupplier1.createdAt.toISOString(),
            supplierNumber: savedCASSupplier1.supplierNumber,
            supplierProtected: savedCASSupplier1.supplierProtected,
            supplierStatus: savedCASSupplier1.supplierStatus,
            isValid: savedCASSupplier1.isValid,
            supplierSiteCode:
              savedCASSupplier1.supplierAddress.supplierSiteCode,
            siteStatus: savedCASSupplier1.supplierAddress.status,
            addressLine1: savedCASSupplier1.supplierAddress.addressLine1,
            siteProtected: savedCASSupplier1.supplierAddress.siteProtected,
            errors: null,
          },
        ],
      });
  });
});
