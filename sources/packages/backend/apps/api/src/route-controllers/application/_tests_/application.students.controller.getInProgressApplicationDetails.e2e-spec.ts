import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getStudentToken,
  FakeStudentUsersTypes,
  mockUserLoginInfo,
} from "../../../testHelpers";
import {
  createFakeCRAIncomeVerification,
  createFakeSupportingUser,
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import { ApplicationStatus, SupportingUserType } from "@sims/sims-db";
import { SuccessWaitingStatus } from "../models/application.dto";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { TestingModule } from "@nestjs/testing";

describe("ApplicationStudentsController(e2e)-getApplicationProgressDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
  });

  it("Should throw not found error when application is not found.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);

    // Mock user services to return the saved student.
    await mockUserLoginInfo(appModule, student);

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
    const student = await saveFakeStudent(db.dataSource);

    // Mock user services to return the saved student.
    await mockUserLoginInfo(appModule, student);

    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      { applicationStatus: ApplicationStatus.InProgress },
    );

    // Create CRA income verifications for student.
    const studentCRAIncomeVerification = createFakeCRAIncomeVerification(
      {
        application,
        applicationEditStatusUpdatedBy: student.user,
      },
      { initialValues: { dateReceived: new Date() } },
    );
    await db.craIncomeVerification.save([studentCRAIncomeVerification]);

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
    const student = await saveFakeStudent(db.dataSource);

    // Mock user services to return the saved student.
    await mockUserLoginInfo(appModule, student);

    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      { applicationStatus: ApplicationStatus.InProgress },
    );

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
        applicationEditStatusUpdatedBy: student.user,
      },
      { initialValues: { dateReceived: new Date() } },
    );
    const parent1CRAIncomeVerification = createFakeCRAIncomeVerification(
      {
        application,
        supportingUser: parent1,
        applicationEditStatusUpdatedBy: student.user,
      },
      { initialValues: { dateReceived: new Date() } },
    );
    const parent2CRAIncomeVerification = createFakeCRAIncomeVerification(
      {
        application,
        supportingUser: parent2,
        applicationEditStatusUpdatedBy: student.user,
      },
      { initialValues: { dateReceived: new Date() } },
    );
    await db.craIncomeVerification.save([
      studentCRAIncomeVerification,
      parent1CRAIncomeVerification,
      parent2CRAIncomeVerification,
    ]);

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
    const student = await saveFakeStudent(db.dataSource);

    // Mock user services to return the saved student.
    await mockUserLoginInfo(appModule, student);

    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      { applicationStatus: ApplicationStatus.InProgress },
    );

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
        applicationEditStatusUpdatedBy: student.user,
      },
      { initialValues: { dateReceived: new Date() } },
    );
    const partnerCRAIncomeVerification = createFakeCRAIncomeVerification(
      {
        application,
        supportingUser: partner,
        applicationEditStatusUpdatedBy: student.user,
      },
      { initialValues: { dateReceived: new Date() } },
    );

    await db.craIncomeVerification.save([
      studentCRAIncomeVerification,
      partnerCRAIncomeVerification,
    ]);

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
    const student = await saveFakeStudent(db.dataSource);

    // Mock user services to return the saved student.
    await mockUserLoginInfo(appModule, student);

    const currentApplication = await saveFakeApplication(
      db.dataSource,
      {
        student,
      },
      { applicationStatus: ApplicationStatus.InProgress },
    );

    // Create a future application with an offering whose study start date and end date are much later
    // than the current offering ones.
    const futureApplication = await saveFakeApplication(db.dataSource, {
      student,
    });
    const currentApplicationOffering =
      currentApplication.currentAssessment.offering;
    const futureOffering = futureApplication.currentAssessment.offering;
    futureOffering.studyStartDate = getISODateOnlyString(
      addDays(10, currentApplicationOffering.studyStartDate),
    );
    futureOffering.studyEndDate = getISODateOnlyString(
      addDays(30, currentApplicationOffering.studyStartDate),
    );
    await db.educationProgramOffering.save(futureOffering);

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
    const student = await saveFakeStudent(db.dataSource);

    // Mock user services to return the saved student.
    await mockUserLoginInfo(appModule, student);

    // Application to get in-progress details.
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

    const currentApplicationOffering =
      currentApplication.currentAssessment.offering;
    const previousApplicationOffering =
      previousApplication.currentAssessment.offering;
    previousApplicationOffering.studyStartDate = getISODateOnlyString(
      addDays(-30, currentApplicationOffering.studyStartDate),
    );
    previousApplicationOffering.studyEndDate = getISODateOnlyString(
      addDays(-10, currentApplicationOffering.studyStartDate),
    );
    await db.educationProgramOffering.save(previousApplicationOffering);

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
