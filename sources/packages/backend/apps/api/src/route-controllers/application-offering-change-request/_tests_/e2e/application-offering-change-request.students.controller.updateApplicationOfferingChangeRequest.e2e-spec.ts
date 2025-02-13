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
import {
  ApplicationOfferingChangeRequest,
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  Student,
} from "@sims/sims-db";
import { Repository } from "typeorm";

describe("ApplicationOfferingChangeRequestStudentsController(e2e)-updateApplicationOfferingChangeRequest", () => {
  let app: INestApplication;
  let student: Student;
  let db: E2EDataSources;
  let applicationOfferingChangeRequestRepo: Repository<ApplicationOfferingChangeRequest>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    applicationOfferingChangeRequestRepo = dataSource.getRepository(
      ApplicationOfferingChangeRequest,
    );
    db = createE2EDataSources(dataSource);
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  it("Should update the application offering change request status for the provided application offering change request id.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        student,
      },
      { applicationStatus: ApplicationStatus.Completed },
    );
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
      .patch(endpoint)
      .send({
        studentConsent: true,
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Check if the application offering change request was updated as expected.
    const updatedApplicationOfferingChangeRequest =
      await applicationOfferingChangeRequestRepo.findOne({
        select: { applicationOfferingChangeRequestStatus: true },
        where: { id: applicationOfferingChangeRequest.id },
      });
    expect(
      updatedApplicationOfferingChangeRequest.applicationOfferingChangeRequestStatus,
    ).toBe(ApplicationOfferingChangeRequestStatus.InProgressWithSABC);
  });

  it("Should throw a HttpStatus Not Found (404) error when an application offering change update is requested for an application not in completed state.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      {
        student,
      },
      { applicationStatus: ApplicationStatus.Edited },
    );
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
      .patch(endpoint)
      .send({
        studentConsent: true,
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          "Application offering change not found or not in valid status to be updated.",
        error: "Not Found",
      });
  });

  it("Should throw a HttpStatus Not Found (404) error when an application offering change is not associated with the authenticated student.", async () => {
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
    const endpoint = `/students/application-offering-change-request/${applicationOfferingChangeRequest.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        studentConsent: true,
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          "Application offering change not found or not in valid status to be updated.",
        error: "Not Found",
      });
  });

  it("Should throw a HttpStatus Not Found (404) error when an application offering change is not in a valid status to be updated.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const applicationOfferingChangeRequest =
      await saveFakeApplicationOfferingRequestChange(
        db,
        {
          application,
        },
        {
          initialValues: {
            applicationOfferingChangeRequestStatus:
              ApplicationOfferingChangeRequestStatus.Approved,
          },
        },
      );
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/application-offering-change-request/${applicationOfferingChangeRequest.id}`;
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        studentConsent: true,
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message:
          "Application offering change not found or not in valid status to be updated.",
        error: "Not Found",
      });
  });

  it("Should throw a HttpStatus Unprocessable Entity (422) error when an invalid application offering change request status is provided.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      { applicationStatus: ApplicationStatus.Completed },
    );
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
      .patch(endpoint)
      .send({
        studentConsent: true,
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.Approved,
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: "Invalid application offering change request status.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw a HttpStatus Unprocessable Entity (422) error when student consent is not provided.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      { applicationStatus: ApplicationStatus.Completed },
    );
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
      .patch(endpoint)
      .send({
        studentConsent: false,
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "Student consent is required to update the application offering change request status.",
        error: "Unprocessable Entity",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
