import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  InstitutionTokenTypes,
  getAuthRelatedEntities,
  getStudentByFakeStudentUserType,
} from "../../../../testHelpers";
import {
  saveFakeApplicationOfferingRequestChange,
  createE2EDataSources,
  E2EDataSources,
  createFakeInstitutionLocation,
  saveFakeApplication,
} from "@sims/test-utils";
import { InstitutionLocation, Student } from "@sims/sims-db";

describe("ApplicationOfferingChangeRequestStudentsController(e2e)-getApplicationOfferingChangeRequest", () => {
  let app: INestApplication;
  let collegeFLocation: InstitutionLocation;
  let student: Student;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  it("Should return the application offering change request details when provided with the application offering change request id.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource, {
      institutionLocation: collegeFLocation,
      student,
    });
    const applicationOfferingChangeRequest =
      await saveFakeApplicationOfferingRequestChange(db, {
        institutionLocation: collegeFLocation,
        application,
      });
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/application-offering-change-request/${applicationOfferingChangeRequest.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        status:
          applicationOfferingChangeRequest.applicationOfferingChangeRequestStatus,
        applicationNumber:
          applicationOfferingChangeRequest.application.applicationNumber,
        locationName:
          applicationOfferingChangeRequest.application.location.name,
        requestedOfferingId:
          applicationOfferingChangeRequest.requestedOffering.id,
        activeOfferingId: applicationOfferingChangeRequest.activeOffering.id,
        reason: applicationOfferingChangeRequest.reason,
      });
  });

  it("Should throw a HttpStatus Not Found (404) when the application offering change request is not associated with the authenticated student.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    const applicationOfferingChangeRequest =
      await saveFakeApplicationOfferingRequestChange(db, {
        application,
      });
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/application-offering-change-request/${applicationOfferingChangeRequest.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Not able to find an Application Offering Change Request.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
