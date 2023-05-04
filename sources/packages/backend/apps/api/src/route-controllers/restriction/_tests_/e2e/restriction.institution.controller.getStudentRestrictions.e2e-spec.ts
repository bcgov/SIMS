import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  createFakeInstitutionLocation,
  saveFakeStudent,
  saveFakeStudentRestriction,
  createFakeApplication,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import {
  Institution,
  InstitutionLocation,
  Application,
  RestrictionNotificationType,
} from "@sims/sims-db";

import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import * as request from "supertest";

describe("RestrictionInstitutionController(e2e)-getStudentRestrictions", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let collegeF: Institution;
  let collegeC: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeCLocation: InstitutionLocation;
  let applicationRepo: Repository<Application>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;

    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institution;
    collegeFLocation = createFakeInstitutionLocation(collegeF);
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    applicationRepo = appDataSource.getRepository(Application);
  });

  it("Should return forbidden 403 error code when a non BC Public Institution User tries to get student restrictions.", async () => {
    // Arrange
    const { institution } = await getAuthRelatedEntities(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    collegeCLocation = createFakeInstitutionLocation(collegeC);
    await authorizeUserTokenForLocation(
      appDataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    const student = await saveFakeStudent(appDataSource);
    const application = createFakeApplication({
      location: collegeCLocation,
      student,
    });
    await applicationRepo.save(application);
    await saveFakeStudentRestriction(
      appDataSource,
      { student, application, creator: student.user },
      {
        restrictionCategory: "Verification",
        notificationType: RestrictionNotificationType.NoEffect,
      },
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const endpoint = `/institutions/restriction/student/${student.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN);
  });

  it("Should return forbidden 403 error code when a BC Public Institution User tries to get student restrictions for a student which they don't have access to.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    await saveFakeStudentRestriction(
      appDataSource,
      { student, creator: student.user },
      {
        restrictionCategory: "Verification",
        notificationType: RestrictionNotificationType.NoEffect,
      },
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/restriction/student/${student.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN);
  });

  it("Should not get the student restriction when the notification type has a value of `No effect` and restriction category has a value of `Verification`.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const application = createFakeApplication({
      location: collegeFLocation,
      student,
    });
    await applicationRepo.save(application);
    await saveFakeStudentRestriction(
      appDataSource,
      { student, application, creator: student.user },
      {
        restrictionCategory: "Verification",
        notificationType: RestrictionNotificationType.NoEffect,
      },
    );
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

  it("Should not get the student restriction when the notification type has a value of `No effect`.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const application = createFakeApplication({
      location: collegeFLocation,
      student,
    });
    await applicationRepo.save(application);
    await saveFakeStudentRestriction(
      appDataSource,
      { student, application, creator: student.user },
      {
        notificationType: RestrictionNotificationType.NoEffect,
      },
    );
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

  it("Should not get the student restriction when the restriction category has a value of `Verification`.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const application = createFakeApplication({
      location: collegeFLocation,
      student,
    });
    await applicationRepo.save(application);
    await saveFakeStudentRestriction(
      appDataSource,
      { student, application, creator: student.user },
      {
        restrictionCategory: "Verification",
      },
    );
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

  it("Should get the student restriction when the notification type is having a value different from `No effect` and restriction category is having a value different from `Verification`.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const application = createFakeApplication({
      location: collegeFLocation,
      student,
    });
    await applicationRepo.save(application);
    const studentRestriction = await saveFakeStudentRestriction(
      appDataSource,
      { student, application, creator: student.user },
      {
        restrictionCategory: "Federal",
        notificationType: RestrictionNotificationType.Warning,
      },
    );
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
          updatedAt: studentRestriction.updatedAt.toISOString(),
          isActive: studentRestriction.isActive,
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
