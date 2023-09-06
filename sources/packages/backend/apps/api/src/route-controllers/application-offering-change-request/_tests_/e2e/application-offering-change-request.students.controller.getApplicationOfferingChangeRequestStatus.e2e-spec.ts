import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  getStudentByFakeStudentUserType,
} from "../../../../testHelpers";
import {
  saveFakeApplicationOfferingRequestChange,
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { ApplicationStatus, Student } from "@sims/sims-db";

describe("ApplicationOfferingChangeRequestStudentsController(e2e)-getApplicationOfferingChangeRequestStatus", () => {
  let app: INestApplication;
  let student: Student;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  // it("Should return the application offering change request status when provided with the application offering change request id.", async () => {
  //   // Arrange
  //   const application = await saveFakeApplication(
  //     db.dataSource,
  //     {
  //       student,
  //     },
  //     { applicationStatus: ApplicationStatus.Completed },
  //   );
  //   const applicationOfferingChangeRequest =
  //     await saveFakeApplicationOfferingRequestChange(db, {
  //       application,
  //     });
  //   const token = await getStudentToken(
  //     FakeStudentUsersTypes.FakeStudentUserType1,
  //   );
  //   const endpoint = `/students/application-offering-change-request/${applicationOfferingChangeRequest.id}/application-offering-change-request-status`;
  //   // Act/Assert
  //   await request(app.getHttpServer())
  //     .get(endpoint)
  //     .auth(token, BEARER_AUTH_TYPE)
  //     .expect(HttpStatus.OK)
  //     .expect({
  //       status:
  //         applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus,
  //     });
  // });

  it("Should throw a HttpStatus Not Found (404) when the application offering status change request is not associated with the authenticated student.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, undefined, {
      applicationStatus: ApplicationStatus.Completed,
    });
    const applicationOfferingChangeRequest =
      await saveFakeApplicationOfferingRequestChange(db, {
        application,
      });
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/application-offering-change-request/${applicationOfferingChangeRequest.id}/application-offering-change-request-status`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Application Offering Change Request not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
