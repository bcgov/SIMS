import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { createFakeDisbursementOveraward } from "@sims/test-utils";
import { Repository } from "typeorm";
import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  Student,
} from "@sims/sims-db";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentByFakeStudentUserType,
  getStudentToken,
} from "../../../../testHelpers";

describe("OverawardStudentsController(e2e)-getOverawardBalance", () => {
  let app: INestApplication;
  let student: Student;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
  });

  it.skip("Should return correct value for overaward balance when available.", async () => {
    // Arrange
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
    const endpoint = "/students/overaward/balance";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        // TODO change the mock student token.
        expect(response.body.overawardBalanceValues.CSLF).toBe("400.00");
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
