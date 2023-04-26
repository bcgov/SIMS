import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createFakeStudent,
  createFakeDisbursementOveraward,
} from "@sims/test-utils";
import { Repository } from "typeorm";
import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  Student,
} from "@sims/sims-db";

import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";

describe("OverawardInstitutionController(e2e)-getOverawardBalance", () => {
  let app: INestApplication;
  let studentRepo: Repository<Student>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    studentRepo = dataSource.getRepository(Student);
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
  });

  it("Should return correct value for overaward balance", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    // Create an overaward.
    const legacyOveraward = createFakeDisbursementOveraward({ student });
    legacyOveraward.disbursementValueCode = "CSLF";
    legacyOveraward.overawardValue = 500;
    legacyOveraward.originType =
      DisbursementOverawardOriginType.LegacyOveraward;
    // Create a manual overaward deduction.
    const manualOveraward = createFakeDisbursementOveraward({ student });
    manualOveraward.disbursementValueCode = "CSLF";
    manualOveraward.overawardValue = -100;
    manualOveraward.originType = DisbursementOverawardOriginType.ManualRecord;
    // Persist the overawards.
    await disbursementOverawardRepo.save([legacyOveraward, manualOveraward]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/overaward/student/${student.id}/balance`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.overawardBalanceValues.CSLF).toBe("400.00");
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
