import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createFakeDisbursementOveraward,
  createFakeInstitutionLocation,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import { Repository, DataSource } from "typeorm";
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

describe("OverawardInstitutionsController(e2e)-getOverawardsByStudent", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
  });

  it("Should return student overawards when student has some overawards.", async () => {
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
    // Prepare the student assessment to create overaward.
    const application = await saveFakeApplication(appDataSource, {
      institutionLocation: collegeFLocation,
    });
    const student = application.student;
    const user = application.student.user;
    // Create an overaward.
    const reassessmentOveraward = createFakeDisbursementOveraward({ student });
    reassessmentOveraward.studentAssessment = application.currentAssessment;
    reassessmentOveraward.creator = user;
    reassessmentOveraward.disbursementValueCode = "CSLF";
    reassessmentOveraward.overawardValue = 100;
    reassessmentOveraward.originType =
      DisbursementOverawardOriginType.ReassessmentOveraward;
    reassessmentOveraward.addedBy = user;
    reassessmentOveraward.addedDate = new Date();
    await disbursementOverawardRepo.save(reassessmentOveraward);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/overaward/student/${student.id}`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(({ body }) =>
        expect(body).toEqual([
          {
            dateAdded: reassessmentOveraward.addedDate!.toISOString(),
            createdAt: reassessmentOveraward.createdAt.toISOString(),
            overawardOrigin: reassessmentOveraward.originType,
            awardValueCode: reassessmentOveraward.disbursementValueCode,
            overawardValue: reassessmentOveraward.overawardValue,
            applicationNumber: application.applicationNumber,
            assessmentTriggerType: application.currentAssessment?.triggerType,
          },
        ]),
      );
  });

  it("Should throw a HttpStatus Forbidden (403) error when a non-public institution accesses the overawards.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    const endpoint = `/institutions/overaward/student/${student.id}`;

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
    const endpoint = `/institutions/overaward/student/${student.id}`;

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
