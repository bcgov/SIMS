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
import { CASSupplierSiteStatus, SupplierStatus } from "@sims/sims-db";

describe("CASSupplierAESTController(e2e)-getCASSuppliers", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should get all the CAS suppliers for a student when requested given a student id.", async () => {
    // Arrange
    const now = new Date();
    const fakeCASSupplierInfo1 = {
      supplierStatus: SupplierStatus.Verified,
      isValid: true,
      supplierAddress: { supplierSiteCode: "123", lastUpdated: now },
      supplierNumber: "0001234",
      supplierProtected: true,
    };
    const fakeCASSupplierInfo2 = {
      supplierStatus: SupplierStatus.PendingSupplierVerification,
      isValid: false,
      supplierAddress: {
        supplierSiteCode: "001",
        lastUpdated: now,
        status: "ACTIVE" as CASSupplierSiteStatus,
        addressLine1: "3350 Douglas St, Victoria BC",
        siteProtected: "YES",
      },
      supplierNumber: "0123456",
      supplierProtected: false,
    };
    const savedCASSupplier1 = await saveFakeCASSupplier(
      db,
      {},
      fakeCASSupplierInfo1,
    );
    const student = savedCASSupplier1.student;
    const savedCASSupplier2 = await saveFakeCASSupplier(
      db,
      { student },
      fakeCASSupplierInfo2,
    );

    const endpoint = `/aest/cas-supplier/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        const casSupplierList = response.body;
        expect(casSupplierList).toEqual([
          {
            dateCreated: savedCASSupplier2.createdAt.toISOString(),
            supplierNumber: fakeCASSupplierInfo2.supplierNumber,
            supplierProtected: fakeCASSupplierInfo2.supplierProtected,
            supplierStatus: fakeCASSupplierInfo2.supplierStatus,
            isValid: fakeCASSupplierInfo2.isValid,
            supplierSiteCode:
              fakeCASSupplierInfo2.supplierAddress.supplierSiteCode,
            siteStatus: fakeCASSupplierInfo2.supplierAddress.status,
            addressLine1: fakeCASSupplierInfo2.supplierAddress.addressLine1,
            siteProtected: fakeCASSupplierInfo2.supplierAddress.siteProtected,
          },
          {
            dateCreated: savedCASSupplier1.createdAt.toISOString(),
            supplierNumber: fakeCASSupplierInfo1.supplierNumber,
            supplierProtected: fakeCASSupplierInfo1.supplierProtected,
            supplierStatus: fakeCASSupplierInfo1.supplierStatus,
            isValid: fakeCASSupplierInfo1.isValid,
            supplierSiteCode:
              fakeCASSupplierInfo1.supplierAddress.supplierSiteCode,
          },
        ]);
      });
  });
});
