import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  createFakeStudentScholasticStanding,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  BEARER_AUTH_TYPE,
  INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
  INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
  InstitutionTokenTypes,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
} from "../../../../testHelpers";
import * as request from "supertest";
import { InstitutionLocation } from "@sims/sims-db";
import { saveFakeSFASIndividual } from "@sims/test-utils/factories/sfas-individuals";

describe("StudentScholasticStandingsInstitutionsController(e2e)-getScholasticStandingSummary.", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation,
    collegeCLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution });
  });

  it("Should throw status code 403 Forbidden when a BC Private Institution requests student scholastic summary.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const endpoint = "/institutions/scholastic-standing/summary/student/9999";
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  it("Should throw status code 403 Forbidden when an institution accesses the scholastic summary for an unauthorized student.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    await saveFakeApplication(db.dataSource, {
      student,
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/scholastic-standing/summary/student/${student.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  it("Should get the scholastic standing summary for the provided student including the data retrieved from the sfas system when a BC Public Institution requests it.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const firstApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
      student,
    });
    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeCLocation = createFakeInstitutionLocation({ institution });
    const secondApplication = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeCLocation,
      student,
    });
    const firstAppScholasticStanding = createFakeStudentScholasticStanding(
      { submittedBy: student.user, application: firstApplication },
      {
        initialValues: { unsuccessfulWeeks: 15 },
      },
    );
    const secondAppScholasticStanding = createFakeStudentScholasticStanding(
      { submittedBy: student.user, application: secondApplication },
      {
        initialValues: { unsuccessfulWeeks: 3 },
      },
    );
    await db.studentScholasticStanding.save([
      firstAppScholasticStanding,
      secondAppScholasticStanding,
    ]);
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: student.user.lastName,
        birthDate: student.birthDate,
        sin: student.sinValidation.sin,
        student,
        unsuccessfulCompletion: 12,
      },
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/scholastic-standing/summary/student/${student.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ lifetimeUnsuccessfulCompletionWeeks: 30 });
  });

  it("Should return zero lifetime unsuccessful completion weeks for the provided student as a part of the student scholastic summary when the student has no unsuccessful completion weeks in SIMS or in the SFAS system when a BC Public Institution requests it.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
      student,
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/scholastic-standing/summary/student/${student.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ lifetimeUnsuccessfulCompletionWeeks: 0 });
  });
});
