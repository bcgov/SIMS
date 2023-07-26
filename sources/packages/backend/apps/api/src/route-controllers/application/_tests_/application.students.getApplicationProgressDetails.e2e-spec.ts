import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  getStudentByFakeStudentUserType,
} from "../../../testHelpers";
import {
  createFakeStudentAppeal,
  createFakeStudentAppealRequest,
  saveFakeApplicationDisbursements,
  saveFakeApplicationOfferingRequestChange,
  createE2EDataSources,
  E2EDataSources,
} from "@sims/test-utils";
import {
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  Student,
  StudentAppeal,
  StudentAppealStatus,
} from "@sims/sims-db";

describe("ApplicationStudentsController(e2e)-getApplicationProgressDetails", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let studentAppealRepo: Repository<StudentAppeal>;
  let student: Student;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);
    studentAppealRepo = dataSource.getRepository(StudentAppeal);
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  it("Should get the status of all requests and confirmations in student application (Appeals, Application Offering Change Requests and COE).", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
      },
    );
    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;
    // Create approved student appeal submitted yesterday.
    const approvedAppealRequest = createFakeStudentAppealRequest();
    const approvedAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [approvedAppealRequest],
    });
    await studentAppealRepo.save(approvedAppeal);
    // Create pending student appeal submitted today.
    const pendingAppealRequest = createFakeStudentAppealRequest();
    pendingAppealRequest.appealStatus = StudentAppealStatus.Pending;
    const pendingAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [pendingAppealRequest],
    });
    await studentAppealRepo.save(pendingAppeal);
    // Create declined student appeal submitted today.
    const declinedAppealRequest = createFakeStudentAppealRequest();
    declinedAppealRequest.appealStatus = StudentAppealStatus.Declined;
    const declinedAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [declinedAppealRequest],
    });
    await studentAppealRepo.save(declinedAppeal);
    // Create approved application offering change request.
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
    // Create pending application offering change request.
    await saveFakeApplicationOfferingRequestChange(db, { application });
    // Create declined application offering change request.
    await saveFakeApplicationOfferingRequestChange(
      db,
      {
        application,
      },
      {
        initialValues: {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
        },
      },
    );
    const endpoint = `/students/application/${application.id}/progress-details`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applicationStatus: application.applicationStatus,
        applicationStatusUpdatedOn:
          application.applicationStatusUpdatedOn.toISOString(),
        pirStatus: application.pirStatus,
        firstCOEStatus: firstDisbursement?.coeStatus,
        secondCOEStatus: secondDisbursement?.coeStatus,
        appealStatus: StudentAppealStatus.Declined,
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
