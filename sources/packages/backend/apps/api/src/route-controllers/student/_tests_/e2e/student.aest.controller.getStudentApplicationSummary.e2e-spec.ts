import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getRecentActiveProgramYear,
} from "../../../../testHelpers";
import {
  saveFakeApplication,
  createE2EDataSources,
  E2EDataSources,
} from "@sims/test-utils";
import { ApplicationStatus, ProgramYear } from "@sims/sims-db";
import { addDays } from "@sims/utilities";

describe("StudentAESTController(e2e)-getStudentApplicationSummary", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let recentActiveProgramYear: ProgramYear;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    recentActiveProgramYear = await getRecentActiveProgramYear(db);
  });

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
        institution:
          olderSubmittedApplication.currentAssessment.offering
            .institutionLocation.institution,
        institutionLocation:
          olderSubmittedApplication.currentAssessment.offering
            .institutionLocation,
      },
      { submittedDate: newerSubmittedDate },
    );

    // Ministry user token.
    const aestUserToken = await getAESTToken(AESTGroups.BusinessAdministrators);

    const endpoint = `/aest/student/${olderSubmittedApplication.student.id}/application-summary?page=0&pageLimit=10`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(aestUserToken, BEARER_AUTH_TYPE)
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
