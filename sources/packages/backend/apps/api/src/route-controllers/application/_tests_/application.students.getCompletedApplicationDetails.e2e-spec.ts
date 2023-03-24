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
  createFakeStudentScholasticStanding,
  createFakeUser,
  saveFakeApplicationDisbursements,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  COEStatus,
  DisbursementSchedule,
  Student,
  StudentAppeal,
  StudentAppealStatus,
  StudentScholasticStanding,
  StudentScholasticStandingChangeType,
  User,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";

describe("ApplicationStudentsController(e2e)-getCompletedApplicationDetails", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let applicationRepo: Repository<Application>;
  let disbursementScheduleRepo: Repository<DisbursementSchedule>;
  let studentScholasticStandingRepo: Repository<StudentScholasticStanding>;
  let studentAppealRepo: Repository<StudentAppeal>;
  let submittedByInstitutionUser: User;
  let student: Student;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    const userRepo = dataSource.getRepository(User);
    applicationRepo = dataSource.getRepository(Application);
    disbursementScheduleRepo = dataSource.getRepository(DisbursementSchedule);
    studentScholasticStandingRepo = dataSource.getRepository(
      StudentScholasticStanding,
    );
    studentAppealRepo = dataSource.getRepository(StudentAppeal);
    submittedByInstitutionUser = await userRepo.save(createFakeUser());
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  it("Should throw NotFoundException when the application is not associated with the authenticated student.", async () => {
    // Arrange
    // The application will be generated with a fake user.
    const application = await saveFakeApplicationDisbursements(appDataSource);
    const endpoint = `/students/application/${application.id}/completed`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Application not found or not on Completed status.",
        error: "Not Found",
      });
  });

  it("Should throw NotFoundException when the application is not in 'Completed' status.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student },
      { createSecondDisbursement: true },
    );
    const endpoint = `/students/application/${application.id}/completed`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Application not found or not on Completed status.",
        error: "Not Found",
      });
  });

  it("Should get application details when application is in 'Completed' status.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student },
      { createSecondDisbursement: true },
    );
    application.applicationStatus = ApplicationStatus.Completed;
    await applicationRepo.save(application);
    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;
    firstDisbursement.coeStatus = COEStatus.completed;
    await disbursementScheduleRepo.save(firstDisbursement);
    const endpoint = `/students/application/${application.id}/completed`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        firstDisbursement: {
          coeStatus: firstDisbursement.coeStatus,
          disbursementScheduleStatus:
            firstDisbursement.disbursementScheduleStatus,
        },
        secondDisbursement: {
          coeStatus: secondDisbursement.coeStatus,
          disbursementScheduleStatus:
            secondDisbursement.disbursementScheduleStatus,
        },
        assessmentTriggerType: application.currentAssessment.triggerType,
      });
  });

  it(`Should get application details with scholastic standing change type when application has a scholastic standing '${StudentScholasticStandingChangeType.StudentDidNotCompleteProgram} associated with.`, async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(appDataSource, {
      student,
    });
    application.applicationStatus = ApplicationStatus.Completed;
    await applicationRepo.save(application);
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    firstDisbursement.coeStatus = COEStatus.completed;
    await disbursementScheduleRepo.save(firstDisbursement);
    // Create a scholastic standing and have it associated with the completed application.
    // 'Student did not complete program' is the only 'scholastic standing that does not generate an assessment.
    // The below record has only a relationship with the application which must be enough to
    // have the scholasticStandingChangeType returned.
    const scholasticStanding = createFakeStudentScholasticStanding({
      submittedBy: submittedByInstitutionUser,
      application,
    });
    await studentScholasticStandingRepo.save(scholasticStanding);

    const endpoint = `/students/application/${application.id}/completed`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        firstDisbursement: {
          coeStatus: firstDisbursement.coeStatus,
          disbursementScheduleStatus:
            firstDisbursement.disbursementScheduleStatus,
        },
        assessmentTriggerType: application.currentAssessment.triggerType,
        scholasticStandingChangeType:
          StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
      });
  });

  it(`Should get application details with the most updated appeal status when the application has more than one student appeals associated with.`, async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(appDataSource, {
      student,
    });
    application.applicationStatus = ApplicationStatus.Completed;
    await applicationRepo.save(application);
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    firstDisbursement.coeStatus = COEStatus.completed;
    await disbursementScheduleRepo.save(firstDisbursement);
    // Create approved student appeal
    const approvedAppealRequest = createFakeStudentAppealRequest();
    approvedAppealRequest.appealStatus = StudentAppealStatus.Approved;
    const approvedAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [approvedAppealRequest],
    });
    approvedAppeal.submittedDate = addDays(-1);
    // Create declined student appeal from yesterday
    const pendingAppealRequest = createFakeStudentAppealRequest();
    pendingAppealRequest.appealStatus = StudentAppealStatus.Pending;
    const pendingAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [pendingAppealRequest],
    });
    await studentAppealRepo.save([approvedAppeal, pendingAppeal]);

    const endpoint = `/students/application/${application.id}/completed`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        firstDisbursement: {
          coeStatus: firstDisbursement.coeStatus,
          disbursementScheduleStatus:
            firstDisbursement.disbursementScheduleStatus,
        },
        assessmentTriggerType: application.currentAssessment.triggerType,
        appealStatus: StudentAppealStatus.Pending,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
