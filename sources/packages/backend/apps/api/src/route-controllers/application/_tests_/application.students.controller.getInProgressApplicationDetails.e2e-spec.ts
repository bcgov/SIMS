import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getStudentToken,
  getStudentByFakeStudentUserType,
  FakeStudentUsersTypes,
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
  Student,
  StudentAssessmentStatus,
  SupportingUserType,
} from "@sims/sims-db";
import { SuccessWaitingStatus } from "../models/application.dto";

describe("ApplicationStudentsController(e2e)-getApplicationProgressDetails", () => {
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
        assessmentInCalculationStep: SuccessWaitingStatus.Success,
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
        assessmentInCalculationStep: SuccessWaitingStatus.Success,
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
        assessmentInCalculationStep: SuccessWaitingStatus.Success,
      });
  });

  it("Should get application in-progress details when there is an in-progress student assessment that is not the current assessment.", async () => {
    // Arrange

    const application = await saveFakeApplication(db.dataSource, { student });

    const previousAssessment = createFakeStudentAssessment(
      {
        auditUser: application.student.user,
        application,
      },
      {
        initialValue: {
          calculationStartDate: new Date(),
          studentAssessmentStatus: StudentAssessmentStatus.InProgress,
        },
      },
    );
    await db.studentAssessment.save(previousAssessment);

    // Create CRA income verifications for student.
    const studentCRAIncomeVerification = createFakeCRAIncomeVerification(
      {
        application,
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
        assessmentInCalculationStep: SuccessWaitingStatus.Waiting,
      });

    // Change the In-progress assessment to Completed to allow other test cases.
    previousAssessment.studentAssessmentStatus =
      StudentAssessmentStatus.Completed;
    await db.studentAssessment.save(previousAssessment);
  });

  afterAll(async () => {
    await app?.close();
  });
});
