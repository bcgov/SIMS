import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  createFakeDisbursementOveraward,
  createFakeInstitutionLocation,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import {
  DisbursementOveraward,
  DisbursementOverawardOriginType,
} from "@sims/sims-db";

import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
  INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
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
    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    const collegeFLocation = createFakeInstitutionLocation({
      institution,
    });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    // Create an Application to allow access to the student.
    const application = await saveFakeApplication(appDataSource, {
      institutionLocation: collegeFLocation,
    });
    const student = application.student;

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
      .expect(({ body }) =>
        expect(body).toEqual({ overawardBalanceValues: { BCSL: 300 } }),
      );
  });

  it("Should throw a HttpStatus Forbidden (403) error when a non-public institution accesses the overawards balance.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const endpoint = `/institutions/overaward/student/${student.id}/balance`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect(({ body }) =>
        expect(body).toEqual({
          statusCode: HttpStatus.FORBIDDEN,
          message: INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
          error: "Forbidden",
        }),
      );
  });

  it("Should throw a HttpStatus Forbidden (403) error when the institution does not have access to the student.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/overaward/student/${student.id}/balance`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect(({ body }) =>
        expect(body).toEqual({
          statusCode: HttpStatus.FORBIDDEN,
          message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
          error: "Forbidden",
        }),
      );
  });

  afterAll(async () => {
    await app?.close();
  });
});
