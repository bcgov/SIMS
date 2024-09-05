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
  saveFakeStudent,
} from "@sims/test-utils";

describe("CASSupplierAESTController(e2e)-addCASSupplier", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should add a new CAS supplier manually when provided supplier info for a student.", async () => {
    // Arrange

    const student = await saveFakeStudent(db.dataSource);
    const payload = {
      supplierNumber: "0001234",
      supplierSiteCode: "987",
    };

    const endpoint = `/aest/cas-supplier/student/${student.id}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect({});
  });
});
