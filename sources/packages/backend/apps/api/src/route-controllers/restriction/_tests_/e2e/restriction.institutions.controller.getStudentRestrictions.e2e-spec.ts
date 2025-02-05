import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  createFakeInstitutionLocation,
  saveFakeStudent,
  saveFakeStudentRestriction,
  saveFakeApplication,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import {
  Institution,
  InstitutionLocation,
  RestrictionNotificationType,
  Restriction,
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
import * as request from "supertest";

describe("RestrictionInstitutionsController(e2e)-getStudentRestrictions.", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeC: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeCLocation: InstitutionLocation;
  let restrictionRepo: Repository<Restriction>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;

    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institution;
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    restrictionRepo = dataSource.getRepository(Restriction);
  });

  it("Should return forbidden 403 error code when a non BC Public Institution User tries to get student restrictions.", async () => {
    // Arrange
    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    collegeCLocation = createFakeInstitutionLocation({ institution: collegeC });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const endpoint = "/institutions/restriction/student/99999";
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

  it("Should return forbidden 403 error code when a BC Public Institution User tries to get student restrictions for a student which they don't have access to.", async () => {
    // Arrange
    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    collegeCLocation = createFakeInstitutionLocation({ institution: collegeC });
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    const student = await saveFakeStudent(appDataSource);
    await saveFakeApplication(appDataSource, {
      institution: collegeC,
      institutionLocation: collegeCLocation,
      student,
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/restriction/student/${student.id}`;
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

  it("Should not get the student restriction when the restriction notification type has a value of 'No effect'.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const application = await saveFakeApplication(appDataSource, {
      institutionLocation: collegeFLocation,
      student,
    });
    const restriction = await restrictionRepo.findOne({
      where: {
        notificationType: RestrictionNotificationType.NoEffect,
      },
    });
    await saveFakeStudentRestriction(appDataSource, {
      student,
      application,
      restriction,
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/restriction/student/${student.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([]);
  });

  it("Should get the student restriction when the restriction notification type has a value different from 'No effect'.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const application = await saveFakeApplication(appDataSource, {
      institutionLocation: collegeFLocation,
      student,
    });
    const restriction = await restrictionRepo.findOne({
      where: {
        notificationType: RestrictionNotificationType.Warning,
      },
    });
    const studentRestriction = await saveFakeStudentRestriction(appDataSource, {
      student,
      application,
      restriction,
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/restriction/student/${student.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          restrictionId: studentRestriction.id,
          restrictionType: studentRestriction.restriction.restrictionType,
          restrictionCategory:
            studentRestriction.restriction.restrictionCategory,
          restrictionCode: studentRestriction.restriction.restrictionCode,
          description: studentRestriction.restriction.description,
          createdAt: studentRestriction.createdAt.toISOString(),
          isActive: studentRestriction.isActive,
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
