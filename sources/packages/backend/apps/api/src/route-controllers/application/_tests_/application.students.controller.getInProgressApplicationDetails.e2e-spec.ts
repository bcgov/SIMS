import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getStudentToken,
  getStudentByFakeStudentUserType,
  FakeStudentUsersTypes,
  mockOutstandingAssessment,
} from "../../../testHelpers";
import {
  createFakeCRAIncomeVerification,
  createFakeSupportingUser,
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
  createFakeStudentAssessment,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  Student,
  StudentAssessmentStatus,
  SupportingUserType,
} from "@sims/sims-db";
import { SuccessWaitingStatus } from "../models/application.dto";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { TestingModule } from "@nestjs/testing";

describe("ApplicationStudentsController(e2e)-getApplicationProgressDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  let student: Student;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  it("Should throw not found error when application is not found.", async () => {
    // Arrange

    const endpoint = `/students/application/99999999/in-progress`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND);
  });

  it("Should get application in-progress details when the student does not have a supporting user.", async () => {
    // Arrange

    const application = await saveFakeApplication(db.dataSource, { student });

    // Create CRA income verifications for student.
    const studentCRAIncomeVerification = createFakeCRAIncomeVerification(
      {
        application,
      },
      { initialValues: { dateReceived: new Date() } },
    );
    await db.craIncomeVerification.save([studentCRAIncomeVerification]);

    // Mock assessment service to return the saved student assessment.
    await mockOutstandingAssessment(appModule, application.currentAssessment);

    const endpoint = `/students/application/${application.id}/in-progress`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: application.id,
        applicationStatus: application.applicationStatus,
        pirStatus: application.pirStatus,
        studentIncomeVerificationStatus: SuccessWaitingStatus.Success,
        outstandingAssessmentStatus: SuccessWaitingStatus.Success,
      });
  });

  it("Should get application in-progress details when the student has parents as supporting users.", async () => {
    // Arrange

    const application = await saveFakeApplication(db.dataSource, { student });

    // Create supporting users.
    const parent1 = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          supportingData: { totalIncome: 2000 },
        },
      },
    );
    const parent2 = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          supportingData: { totalIncome: 2000 },
        },
      },
    );
    await db.supportingUser.save([parent1, parent2]);

    // Create CRA income verifications for student, parent1 and parent2.
    const studentCRAIncomeVerification = createFakeCRAIncomeVerification(
      {
        application,
      },
      { initialValues: { dateReceived: new Date() } },
    );
    const parent1CRAIncomeVerification = createFakeCRAIncomeVerification(
      {
        application,
        supportingUser: parent1,
      },
      { initialValues: { dateReceived: new Date() } },
    );
    const parent2CRAIncomeVerification = createFakeCRAIncomeVerification(
      {
        application,
        supportingUser: parent2,
      },
      { initialValues: { dateReceived: new Date() } },
    );
    await db.craIncomeVerification.save([
      studentCRAIncomeVerification,
      parent1CRAIncomeVerification,
      parent2CRAIncomeVerification,
    ]);

    // Mock assessment service to return the saved student assessment.
    await mockOutstandingAssessment(appModule, application.currentAssessment);

    const endpoint = `/students/application/${application.id}/in-progress`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: application.id,
        applicationStatus: application.applicationStatus,
        pirStatus: application.pirStatus,
        studentIncomeVerificationStatus: SuccessWaitingStatus.Success,
        parent1IncomeVerificationStatus: SuccessWaitingStatus.Success,
        parent2IncomeVerificationStatus: SuccessWaitingStatus.Success,
        parent1Info: SuccessWaitingStatus.Success,
        parent2Info: SuccessWaitingStatus.Success,
        outstandingAssessmentStatus: SuccessWaitingStatus.Success,
      });
  });

  it("Should get application in-progress details when the student has partner as supporting user.", async () => {
    // Arrange

    const application = await saveFakeApplication(db.dataSource, { student });

    // Create supporting users.
    const partner = createFakeSupportingUser(
      { application },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Partner,
          supportingData: { totalIncome: 2000 },
        },
      },
    );
    await db.supportingUser.save([partner]);

    // Create CRA income verifications for student and partner.
    const studentCRAIncomeVerification = createFakeCRAIncomeVerification(
      {
        application,
      },
      { initialValues: { dateReceived: new Date() } },
    );
    const partnerCRAIncomeVerification = createFakeCRAIncomeVerification(
      {
        application,
        supportingUser: partner,
      },
      { initialValues: { dateReceived: new Date() } },
    );

    await db.craIncomeVerification.save([
      studentCRAIncomeVerification,
      partnerCRAIncomeVerification,
    ]);

    // Mock assessment service to return the saved student assessment.
    await mockOutstandingAssessment(appModule, application.currentAssessment);

    const endpoint = `/students/application/${application.id}/in-progress`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: application.id,
        applicationStatus: application.applicationStatus,
        pirStatus: application.pirStatus,
        studentIncomeVerificationStatus: SuccessWaitingStatus.Success,
        partnerIncomeVerificationStatus: SuccessWaitingStatus.Success,
        partnerInfo: SuccessWaitingStatus.Success,
        outstandingAssessmentStatus: SuccessWaitingStatus.Success,
      });
  });

  it("Should get application in-progress details when there is an in-progress student assessment for an offering with later study start date.", async () => {
    // Arrange

    const currentApplication = await saveFakeApplication(db.dataSource, {
      student,
    });

    // Create a future application with an offering whose study start date and end date are much later
    // than the current offering ones.
    const futureApplication = await saveFakeApplication(db.dataSource, {
      student,
    });
    const futureOffering = futureApplication.currentAssessment.offering;
    futureOffering.studyStartDate = getISODateOnlyString(addDays(60));
    futureOffering.studyEndDate = getISODateOnlyString(addDays(90));
    await db.educationProgramOffering.save(futureOffering);

    // Create an in-progress student assessment for the future offering.
    const futureAssessment = createFakeStudentAssessment(
      {
        auditUser: futureApplication.student.user,
        application: futureApplication,
        offering: futureOffering,
      },
      {
        initialValue: {
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );
    await db.studentAssessment.save(futureAssessment);

    // Mock assessment service to return the saved student assessment.
    await mockOutstandingAssessment(
      appModule,
      currentApplication.currentAssessment,
    );

    const endpoint = `/students/application/${currentApplication.id}/in-progress`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    // The current assessment is not blocked by the future assessment because it is assessed first and
    // the offering study start date is earlier than the future offering.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: currentApplication.id,
        applicationStatus: currentApplication.applicationStatus,
        pirStatus: currentApplication.pirStatus,
        outstandingAssessmentStatus: SuccessWaitingStatus.Success,
      });
  });

  it("Should get application in-progress details when there is an in-progress student assessment for an offering with earlier study start date.", async () => {
    // Arrange

    const currentApplication = await saveFakeApplication(
      db.dataSource,
      {
        student,
      },
      { applicationStatus: ApplicationStatus.InProgress },
    );

    // Create a previous application with an offering whose study start date and end date are much earlier
    // than the current offering ones.
    const previousApplication = await saveFakeApplication(
      db.dataSource,
      {
        student,
      },
      { applicationStatus: ApplicationStatus.InProgress },
    );
    // Create a previous offering.
    const currentApplicationOffering =
      currentApplication.currentAssessment.offering;
    const previousApplicationOffering =
      previousApplication.currentAssessment.offering;
    previousApplicationOffering.studyStartDate = getISODateOnlyString(
      addDays(-10, currentApplicationOffering.studyStartDate),
    );
    await db.educationProgramOffering.save(previousApplicationOffering);

    // Create an in-progress student assessment for the previous offering.
    const previousAssessment = createFakeStudentAssessment(
      {
        auditUser: previousApplication.student.user,
        application: previousApplication,
        offering: previousApplicationOffering,
      },
      {
        initialValue: {
          calculationStartDate: addDays(-10),
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );
    await db.studentAssessment.save(previousAssessment);

    const endpoint = `/students/application/${currentApplication.id}/in-progress`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    // The current assessment is blocked by the previous assessment, so the outstanding assessment status is waiting.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        id: currentApplication.id,
        applicationStatus: currentApplication.applicationStatus,
        pirStatus: currentApplication.pirStatus,
        outstandingAssessmentStatus: SuccessWaitingStatus.Waiting,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
