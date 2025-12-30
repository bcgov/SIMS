import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createFakeDisbursementOveraward,
  saveFakeStudent,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
} from "@sims/sims-db";

import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";

describe("OverawardInstitutionsController(e2e)-getOverawardBalance", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
  });

  it("Should return correct value for overaward balance when student has some overawards.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    // Create an overaward.
    const legacyOveraward = createFakeDisbursementOveraward({ student });
    legacyOveraward.disbursementValueCode = "BCSL";
    legacyOveraward.overawardValue = 500;
    legacyOveraward.originType =
      DisbursementOverawardOriginType.LegacyOveraward;
    // Create a manual overaward deduction.
    const manualOveraward = createFakeDisbursementOveraward({ student });
    manualOveraward.disbursementValueCode = "BCSL";
    manualOveraward.overawardValue = -200;
    manualOveraward.originType = DisbursementOverawardOriginType.ManualRecord;
    // Persist the overawards.
    await disbursementOverawardRepo.save([legacyOveraward, manualOveraward]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/overaward/student/${student.id}/balance`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ overawardBalanceValues: { BCSL: 300 } });
  });

  afterAll(async () => {
    await app?.close();
  });
});
