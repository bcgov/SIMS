import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAppeal,
  createFakeStudentAppealRequest,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { ApplicationStatus, StudentAppealStatus } from "@sims/sims-db";

describe("StudentAppealAESTController(e2e)-getAppeals", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);
  });

  it("Should return result count as 1 when there is one pending appeal for student application with multiple appeal requests.", async () => {
    // Arrange
    // Create student to submit application.
    const student = await saveFakeStudent(appDataSource);
    // Create application to request change.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
      },
      { applicationStatus: ApplicationStatus.Completed },
    );
    // Create pending student appeal.
    const appealRequest = createFakeStudentAppealRequest(
      {},
      { initialValues: { appealStatus: StudentAppealStatus.Pending } },
    );
    const secondAppealRequest = createFakeStudentAppealRequest(
      {},
      { initialValues: { appealStatus: StudentAppealStatus.Pending } },
    );
    const appeal = createFakeStudentAppeal({
      application,
      appealRequests: [appealRequest, secondAppealRequest],
    });
    await db.studentAppeal.save(appeal);

    const searchCriteria = JSON.stringify({
      appealsType: "appeals", // This should match appeals submitted in 2025 or later
      searchText: application.applicationNumber,
    });
    const endpoint = `/aest/appeal/pending?page=0&pageLimit=10&sortField=submittedDate&sortOrder=ASC&searchCriteria=${encodeURIComponent(
      searchCriteria,
    )}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toEqual({
          count: 1,
          results: [
            {
              appealId: appeal.id,
              applicationId: application.id,
              applicationNumber: application.applicationNumber,
              firstName: student.user.firstName,
              lastName: student.user.lastName,
              studentId: student.id,
              submittedDate: appeal.submittedDate.toISOString(),
            },
          ],
        });
      });
  });

  it("Should return result count as 1 when there is one pending change request for student application submitted before 2025.", async () => {
    // Arrange
    // Create student to submit application.
    const student = await saveFakeStudent(appDataSource);
    // Create application to request change.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        student,
      },
      { applicationStatus: ApplicationStatus.Completed },
    );
    // Create pending student appeal with submitted date before 2025.
    const appealRequest = createFakeStudentAppealRequest(
      {},
      { initialValues: { appealStatus: StudentAppealStatus.Pending } },
    );
    const secondAppealRequest = createFakeStudentAppealRequest(
      {},
      { initialValues: { appealStatus: StudentAppealStatus.Pending } },
    );
    const appeal = createFakeStudentAppeal({
      application,
      appealRequests: [appealRequest, secondAppealRequest],
    });
    // Set submitted date to before 2025 for change requests
    appeal.submittedDate = new Date("2024-12-31T23:59:59.000Z");
    await db.studentAppeal.save(appeal);

    const searchCriteria = JSON.stringify({
      appealsType: "change-requests", // This should match appeals submitted before 2025
      searchText: application.applicationNumber,
    });
    const endpoint = `/aest/appeal/pending?page=0&pageLimit=10&sortField=submittedDate&sortOrder=ASC&searchCriteria=${encodeURIComponent(
      searchCriteria,
    )}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toEqual({
          count: 1,
          results: [
            {
              appealId: appeal.id,
              applicationId: application.id,
              applicationNumber: application.applicationNumber,
              firstName: student.user.firstName,
              lastName: student.user.lastName,
              studentId: student.id,
              submittedDate: appeal.submittedDate.toISOString(),
            },
          ],
        });
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
