import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getRecentActiveProgramYear,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { ApplicationStatus, ProgramYear } from "@sims/sims-db";

describe("StudentStudentsController(e2e)-getStudentApplicationSummary", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  let recentActiveProgramYear: ProgramYear;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
    recentActiveProgramYear = await getRecentActiveProgramYear(db);
  });

  beforeEach(() => {
    resetMockJWTUserInfo(appModule);
  });

  it(`Should get student application summary when the student has an application in status ${ApplicationStatus.Submitted}.`, async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const savedApplication = await saveFakeApplication(db.dataSource, {
      student,
      programYear: recentActiveProgramYear,
    });
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/student/application-summary?page=0&pageLimit=10`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: savedApplication.id,
            applicationNumber: savedApplication.applicationNumber,
            isArchived: false,
            studyStartPeriod:
              savedApplication.currentAssessment.offering.studyStartDate,
            studyEndPeriod:
              savedApplication.currentAssessment.offering.studyEndDate,
            status: ApplicationStatus.Submitted,
            parentApplicationId: savedApplication.id,
            submittedDate: savedApplication.submittedDate.toISOString(),
            isChangeRequestAllowedForPY: true,
            offeringIntensity: savedApplication.offeringIntensity,
            isEligibleForApplicationAppeals: false,
          },
        ],
        count: 1,
      });
  });

  it(
    `Should get student application summary when the student has an application in status ${ApplicationStatus.Completed}` +
      " and the application is eligible for application appeals.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const savedApplication = await saveFakeApplication(
        db.dataSource,
        {
          student,
          programYear: recentActiveProgramYear,
        },
        {
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            eligibleApplicationAppeals: ["someEligibleAppeal"],
          },
        },
      );

      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, student.user);

      // Get any student user token.
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      const endpoint = `/students/student/application-summary?page=0&pageLimit=10`;
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              id: savedApplication.id,
              applicationNumber: savedApplication.applicationNumber,
              isArchived: false,
              studyStartPeriod:
                savedApplication.currentAssessment.offering.studyStartDate,
              studyEndPeriod:
                savedApplication.currentAssessment.offering.studyEndDate,
              status: ApplicationStatus.Completed,
              parentApplicationId: savedApplication.id,
              submittedDate: savedApplication.submittedDate.toISOString(),
              isChangeRequestAllowedForPY: true,
              offeringIntensity: savedApplication.offeringIntensity,
              isEligibleForApplicationAppeals: true,
            },
          ],
          count: 1,
        });
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
