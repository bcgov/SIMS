import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
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
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { ApplicationStatus, ProgramYear } from "@sims/sims-db";
import { addDays } from "@sims/utilities";

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
    const savedApplication = await saveFakeApplication(db.dataSource, {
      programYear: recentActiveProgramYear,
    });
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, savedApplication.student.user);

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
            lastSubmittedDate: savedApplication.submittedDate.toISOString(),
            isChangeRequestAllowedForPY: true,
            offeringIntensity: savedApplication.offeringIntensity,
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
      const savedApplication = await saveFakeApplication(
        db.dataSource,
        {
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
      await mockJWTUserInfo(appModule, savedApplication.student.user);

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
              lastSubmittedDate: savedApplication.submittedDate.toISOString(),
              isChangeRequestAllowedForPY: true,
              offeringIntensity: savedApplication.offeringIntensity,
            },
          ],
          count: 1,
        });
    },
  );

  it("Should use original submission date in descending order as default tie-breaker when application statuses are the same.", async () => {
    // Arrange
    const olderSubmittedDate = addDays(-2);
    const newerSubmittedDate = addDays(-1);
    const olderSubmittedApplication = await saveFakeApplication(
      db.dataSource,
      {
        programYear: recentActiveProgramYear,
      },
      { submittedDate: olderSubmittedDate },
    );
    const newerSubmittedApplication = await saveFakeApplication(
      db.dataSource,
      {
        programYear: recentActiveProgramYear,
        student: olderSubmittedApplication.student,
      },
      { submittedDate: newerSubmittedDate },
    );

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, olderSubmittedApplication.student.user);

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
            id: newerSubmittedApplication.id,
            applicationNumber: newerSubmittedApplication.applicationNumber,
            isArchived: false,
            studyStartPeriod:
              newerSubmittedApplication.currentAssessment.offering
                .studyStartDate,
            studyEndPeriod:
              newerSubmittedApplication.currentAssessment.offering.studyEndDate,
            status: ApplicationStatus.Submitted,
            parentApplicationId: newerSubmittedApplication.id,
            submittedDate: newerSubmittedDate.toISOString(),
            lastSubmittedDate: newerSubmittedDate.toISOString(),
            isChangeRequestAllowedForPY: true,
            offeringIntensity: newerSubmittedApplication.offeringIntensity,
          },
          {
            id: olderSubmittedApplication.id,
            applicationNumber: olderSubmittedApplication.applicationNumber,
            isArchived: false,
            studyStartPeriod:
              olderSubmittedApplication.currentAssessment.offering
                .studyStartDate,
            studyEndPeriod:
              olderSubmittedApplication.currentAssessment.offering.studyEndDate,
            status: ApplicationStatus.Submitted,
            parentApplicationId: olderSubmittedApplication.id,
            submittedDate: olderSubmittedDate.toISOString(),
            lastSubmittedDate: olderSubmittedDate.toISOString(),
            isChangeRequestAllowedForPY: true,
            offeringIntensity: olderSubmittedApplication.offeringIntensity,
          },
        ],
        count: 2,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
