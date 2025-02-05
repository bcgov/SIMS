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
import { getUserFullName } from "../../../../utilities";
import { RESTRICTION_NOT_FOUND_ERROR_MESSAGE } from "../../../../services/restriction/constants";

describe("RestrictionInstitutionsController(e2e)-getStudentRestrictionDetail.", () => {
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

  it("Should return 403 Forbidden error code when a non BC Public Institution User tries to get student restriction by student restriction id.", async () => {
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
    const endpoint =
      "/institutions/restriction/student/11111/student-restriction/99999";
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

  it("Should return 403 Forbidden error code when a BC Public Institution User tries to get student restriction for a student which they don't have access to.", async () => {
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
    saveFakeApplication(appDataSource, {
      institutionLocation: collegeCLocation,
      student,
    });

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/restriction/student/${student.id}/student-restriction/99999`;
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

  it("Should return a 404 Not Found error code when a BC Public Institution User gets a student restriction for a student they have access to but the restriction notification type has a value of 'No effect'.", async () => {
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
    const studentRestriction = await saveFakeStudentRestriction(appDataSource, {
      student,
      application,
      restriction,
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/restriction/student/${student.id}/student-restriction/${studentRestriction.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: RESTRICTION_NOT_FOUND_ERROR_MESSAGE,
        error: "Not Found",
      });
  });

  it("Should get the student restriction when a BC Public Institution User gets a student restriction for a student they have access to and when the restriction notification type has a value other than 'No effect'.", async () => {
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
    const endpoint = `/institutions/restriction/student/${student.id}/student-restriction/${studentRestriction.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        restrictionId: studentRestriction.id,
        restrictionType: studentRestriction.restriction.restrictionType,
        restrictionCategory: studentRestriction.restriction.restrictionCategory,
        restrictionCode: studentRestriction.restriction.restrictionCode,
        restrictionNote: studentRestriction.restrictionNote.description,
        description: studentRestriction.restriction.description,
        createdAt: studentRestriction.createdAt.toISOString(),
        createdBy: getUserFullName(studentRestriction.creator),
        isActive: studentRestriction.isActive,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
