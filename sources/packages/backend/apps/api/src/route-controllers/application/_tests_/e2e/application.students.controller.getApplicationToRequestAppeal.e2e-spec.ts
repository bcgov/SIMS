import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../testHelpers";
import {
  saveFakeApplicationDisbursements,
  createE2EDataSources,
  E2EDataSources,
  createFakeSupportingUser,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  OfferingIntensity,
  SupportingUserType,
} from "@sims/sims-db";

describe("ApplicationStudentsController(e2e)-getApplicationToRequestAppeal", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it(`Should get the application details for appeal when the application status is ${ApplicationStatus.Completed} and offering intensity is full-time.`, async () => {
    // Arrange
    // Create a completed application with full-time offering intensity.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      undefined,
      {
        applicationStatus: ApplicationStatus.Completed,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );
    const endpoint = `/students/application/${application.id}/appeal`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, application.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: application.id,
        applicationNumber: application.applicationNumber,
        programYear: application.programYear.programYear,
        supportingUserParents: [],
      });
  });

  it(
    `Should get the application details for appeal when the application status is ${ApplicationStatus.Completed} and offering intensity is full-time` +
      " and the application has both the parents reported as supporting users.",
    async () => {
      // Arrange

      // Create a completed application with full-time offering intensity.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        undefined,
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.fullTime,
        },
      );
      // Create supporting user parents for the application.
      const parent1 = createFakeSupportingUser(
        { application },
        {
          initialValues: {
            supportingUserType: SupportingUserType.Parent,
            fullName: "Parent One",
          },
        },
      );
      const parent2 = createFakeSupportingUser(
        { application },
        {
          initialValues: {
            supportingUserType: SupportingUserType.Parent,
            fullName: "Parent Two",
          },
        },
      );
      await db.supportingUser.save([parent1, parent2]);
      const endpoint = `/students/application/${application.id}/appeal`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await mockJWTUserInfo(appModule, application.student.user);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          id: application.id,
          applicationNumber: application.applicationNumber,
          programYear: application.programYear.programYear,
          supportingUserParents: [
            { id: parent1.id, fullName: parent1.fullName },
            { id: parent2.id, fullName: parent2.fullName },
          ],
        });
    },
  );

  it("Should throw not found error when application is not found.", async () => {
    // Arrange
    const endpoint = `/students/application/99999999/appeal`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message:
          "Given application either does not exist or is not complete to request change.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
