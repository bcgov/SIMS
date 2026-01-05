import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { ArrayContains, DataSource, IsNull, Repository } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../testHelpers";
import {
  createFakeStudentAppeal,
  createFakeStudentAppealRequest,
  createFakeStudentScholasticStanding,
  createFakeUser,
  saveFakeApplicationDisbursements,
  saveFakeApplicationOfferingRequestChange,
  createE2EDataSources,
  E2EDataSources,
  createFakeDisbursementFeedbackError,
  saveFakeStudentRestriction,
  createFakeMSFAANumber,
  MSFAAStates,
  saveFakeStudent,
  createFakeDisbursementValue,
  saveFakeApplication,
  createFakeCRAIncomeVerification,
  createFakeSupportingUser,
  RestrictionCode,
  saveFakeInstitutionRestriction,
} from "@sims/test-utils";
import {
  Application,
  ApplicationEditStatus,
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisabilityStatus,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValueType,
  MSFAANumber,
  OfferingIntensity,
  RestrictionActionType,
  RestrictionType,
  Student,
  StudentAppeal,
  StudentAppealStatus,
  StudentScholasticStanding,
  StudentScholasticStandingChangeType,
  SupportingUserType,
  User,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE } from "@sims/services/constants";
import { ECertFailedValidation } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";
import { SuccessWaitingStatus } from "../models/application.dto";

describe("ApplicationStudentsController(e2e)-getCompletedApplicationDetails", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let appDataSource: DataSource;
  let applicationRepo: Repository<Application>;
  let disbursementScheduleRepo: Repository<DisbursementSchedule>;
  let studentScholasticStandingRepo: Repository<StudentScholasticStanding>;
  let studentAppealRepo: Repository<StudentAppeal>;
  let submittedByInstitutionUser: User;
  let sharedStudent: Student;
  let sharedSignedMSFAANumber: MSFAANumber;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);
    const userRepo = dataSource.getRepository(User);
    applicationRepo = dataSource.getRepository(Application);
    disbursementScheduleRepo = dataSource.getRepository(DisbursementSchedule);
    studentScholasticStandingRepo = dataSource.getRepository(
      StudentScholasticStanding,
    );
    studentAppealRepo = dataSource.getRepository(StudentAppeal);
    submittedByInstitutionUser = await userRepo.save(createFakeUser());
    // Create a student with valid SIN and valid MSFAA number.
    sharedStudent = await saveFakeStudent(db.dataSource);
    sharedSignedMSFAANumber = createFakeMSFAANumber(
      { student: sharedStudent },
      {
        msfaaState: MSFAAStates.Signed,
      },
    );
    await db.msfaaNumber.save(sharedSignedMSFAANumber);
  });

  beforeEach(async () => {
    await mockUserLoginInfo(appModule, sharedStudent);
  });

  it("Should throw NotFoundException when the application is not associated with the authenticated student.", async () => {
    // Arrange
    // The application will be generated with a fake user.
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      undefined,
      { applicationStatus: ApplicationStatus.Completed },
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

  it("Should throw NotFoundException when the application is not in 'Completed' status.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
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
      { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
      {
        createSecondDisbursement: true,
        firstDisbursementInitialValues: { coeStatus: COEStatus.completed },
      },
    );
    application.applicationStatus = ApplicationStatus.Completed;
    await applicationRepo.save(application);
    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;

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
        hasBlockFundingFeedbackError: false,
        hasActiveUnsuccessfulCompletionWeeks: false,
        eCertFailedValidations: [],
      });
  });

  it(`Should get application details with scholastic standing change type when application has a scholastic standing '${StudentScholasticStandingChangeType.StudentDidNotCompleteProgram} associated with.`, async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
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
        hasActiveUnsuccessfulCompletionWeeks: true,
        hasBlockFundingFeedbackError: false,
        eCertFailedValidations: [],
      });
  });

  it("Should get application details with the most updated appeal status and most updated application offering change request status when the application has more than one student appeals and more than one application offering change requests associated with it.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    // Create approved student appeal submitted yesterday.
    const approvedAppealRequest = createFakeStudentAppealRequest();
    approvedAppealRequest.appealStatus = StudentAppealStatus.Approved;
    const approvedAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [approvedAppealRequest],
    });
    approvedAppeal.submittedDate = addDays(-1);
    // Create pending student appeal submitted today.
    const pendingAppealRequest = createFakeStudentAppealRequest();
    pendingAppealRequest.appealStatus = StudentAppealStatus.Pending;
    const pendingAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [pendingAppealRequest],
    });
    await studentAppealRepo.save([approvedAppeal, pendingAppeal]);
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
    // Create pending application offering change request.
    const pendingApplicationOfferingChangeRequest =
      await saveFakeApplicationOfferingRequestChange(db, { application });
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
        applicationOfferingChangeRequestId:
          pendingApplicationOfferingChangeRequest.id,
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
        hasActiveUnsuccessfulCompletionWeeks: false,
        hasBlockFundingFeedbackError: false,
        eCertFailedValidations: [],
      });
  });

  it("Should get application details when the current assessment is impacted and the trigger type is 'Related application changed'.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
      {
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.completed,
        },
      },
    );
    application.currentAssessment.triggerType =
      AssessmentTriggerType.RelatedApplicationChanged;
    await applicationRepo.save(application);

    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;

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
        assessmentTriggerType: AssessmentTriggerType.RelatedApplicationChanged,
        hasBlockFundingFeedbackError: false,
        hasActiveUnsuccessfulCompletionWeeks: false,
        eCertFailedValidations: [],
      });
  });

  it(
    "Should get application details with feedback error status as false when the application has one or more feedback errors but none of them" +
      " block funding and the offering intensity is part-time.",
    async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;
      // Feedback error which does not block funding.
      const eCertFeedbackError = await db.eCertFeedbackError.findOne({
        select: { id: true },
        where: {
          blockFunding: false,
          offeringIntensity: OfferingIntensity.partTime,
        },
      });
      // Create fake disbursement feedback error.
      const feedbackError = createFakeDisbursementFeedbackError({
        disbursementSchedule: firstDisbursement,
        eCertFeedbackError,
      });
      await db.disbursementFeedbackErrors.save(feedbackError);
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
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
          assessmentTriggerType: application.currentAssessment.triggerType,
          hasBlockFundingFeedbackError: false,
          hasActiveUnsuccessfulCompletionWeeks: false,
          eCertFailedValidations: [],
        });
    },
  );

  it(
    "Should get application details with feedback error status as true when the application has one or more feedback errors" +
      " that block funding and the offering intensity is part-time.",
    async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;
      // Feedback error which blocks funding.
      const eCertFeedbackError = await db.eCertFeedbackError.findOne({
        select: { id: true },
        where: {
          blockFunding: true,
          offeringIntensity: OfferingIntensity.partTime,
        },
      });
      // Create fake disbursement feedback error.
      const feedbackError = createFakeDisbursementFeedbackError({
        disbursementSchedule: firstDisbursement,
        eCertFeedbackError,
      });
      await db.disbursementFeedbackErrors.save(feedbackError);
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
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
          assessmentTriggerType: application.currentAssessment.triggerType,
          hasBlockFundingFeedbackError: true,
          hasActiveUnsuccessfulCompletionWeeks: false,
          eCertFailedValidations: [],
        });
    },
  );

  it(
    "Should get application details with feedback error status as true when the application has one or more feedback errors" +
      " that block funding received for second disbursement and the offering intensity is part-time.",
    async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
        {
          createSecondDisbursement: true,
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
          secondDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      const [, secondDisbursement] =
        application.currentAssessment.disbursementSchedules;
      // Feedback error which blocks funding.
      const eCertFeedbackError = await db.eCertFeedbackError.findOne({
        select: { id: true },
        where: {
          blockFunding: true,
          offeringIntensity: OfferingIntensity.partTime,
        },
      });
      // Create fake disbursement feedback error.
      const feedbackError = createFakeDisbursementFeedbackError({
        disbursementSchedule: secondDisbursement,
        eCertFeedbackError,
      });
      await db.disbursementFeedbackErrors.save(feedbackError);
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
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
          secondDisbursement: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
          assessmentTriggerType: application.currentAssessment.triggerType,
          hasBlockFundingFeedbackError: true,
          hasActiveUnsuccessfulCompletionWeeks: false,
          eCertFailedValidations: [],
        });
    },
  );

  it(
    "Should get application details with feedback error status as true when the application has one or more feedback errors" +
      " that block funding and the offering intensity is full-time.",
    async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.fullTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;
      // Feedback error for full-time which blocks funding.
      const eCertFeedbackError = await db.eCertFeedbackError.findOne({
        select: { id: true },
        where: {
          blockFunding: true,
          offeringIntensity: OfferingIntensity.fullTime,
        },
      });
      // Create fake disbursement feedback error.
      const feedbackError = createFakeDisbursementFeedbackError({
        disbursementSchedule: firstDisbursement,
        eCertFeedbackError,
      });
      await db.disbursementFeedbackErrors.save(feedbackError);
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
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
          assessmentTriggerType: application.currentAssessment.triggerType,
          hasBlockFundingFeedbackError: true,
          hasActiveUnsuccessfulCompletionWeeks: false,
          eCertFailedValidations: [],
        });
    },
  );

  it(
    "Should get application details with ecert failed validations array having disability status not confirmed when " +
      "the calculated PDPPD status is true and the student's disability status is permanent disability and the offering intensity is part time.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource, undefined, {
        initialValue: {
          disabilityStatus: DisabilityStatus.Requested,
        },
      });
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Signed,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          student,
          msfaaNumber,
        },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        },
      );
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;

      application.currentAssessment.workflowData.calculatedData.pdppdStatus = true;
      await db.studentAssessment.save(application.currentAssessment);

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
          hasBlockFundingFeedbackError: false,
          hasActiveUnsuccessfulCompletionWeeks: false,
          eCertFailedValidations: [
            ECertFailedValidation.DisabilityStatusNotConfirmed,
          ],
          eCertFailedValidationsInfo: {
            hasEffectiveAviationRestriction: false,
          },
        });
    },
  );

  it(
    "Should get application details with ecert failed validations array having MSFAA not signed, cancelled and not valid when " +
      "the the MSFAA number is not signed and there is a cancelled date and the offering intensity is part time.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Pending | MSFAAStates.CancelledOtherProvince,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student, msfaaNumber },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        },
      );
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;

      msfaaNumber.cancelledDate = getISODateOnlyString(new Date());
      await db.msfaaNumber.save(msfaaNumber);

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
          hasActiveUnsuccessfulCompletionWeeks: false,
          hasBlockFundingFeedbackError: false,
          eCertFailedValidations: [
            ECertFailedValidation.MSFAACanceled,
            ECertFailedValidation.MSFAANotSigned,
          ],
          eCertFailedValidationsInfo: {
            hasEffectiveAviationRestriction: false,
          },
        });
    },
  );

  it(
    "Should get application details with ecert failed validations array having stop disbursement restriction when " +
      "there are restrictions associated with the current student and the offering intensity is part time.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Signed,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student, msfaaNumber },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        },
      );
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;

      const restriction = await db.restriction.findOne({
        select: { id: true },
        where: {
          actionType: ArrayContains([
            RestrictionActionType.StopPartTimeDisbursement,
          ]),
          actionEffectiveConditions: IsNull(),
        },
      });
      await saveFakeStudentRestriction(db.dataSource, {
        student,
        application,
        restriction,
      });

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
          hasActiveUnsuccessfulCompletionWeeks: false,
          hasBlockFundingFeedbackError: false,
          eCertFailedValidations: [
            ECertFailedValidation.HasStopDisbursementRestriction,
          ],
          eCertFailedValidationsInfo: {
            hasEffectiveAviationRestriction: false,
          },
        });
    },
  );

  it(
    "Should get application details with ecert failed validations array having stop disbursement institution restriction when" +
      " there is an effective restriction on institution account for the application location and program" +
      " and the offering intensity is part-time.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Signed,
          msfaaInitialValues: { offeringIntensity: OfferingIntensity.partTime },
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student, msfaaNumber },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        },
      );
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;

      // Institution restriction.
      const restriction = await db.restriction.findOne({
        select: { id: true },
        where: {
          restrictionType: RestrictionType.Institution,
          actionType: ArrayContains([
            RestrictionActionType.StopPartTimeDisbursement,
          ]),
        },
      });
      const location =
        application.currentAssessment.offering.institutionLocation;
      const program = application.currentAssessment.offering.educationProgram;
      const institution =
        application.currentAssessment.offering.institutionLocation.institution;
      await saveFakeInstitutionRestriction(db, {
        restriction,
        institution,
        location,
        program,
      });

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
          hasActiveUnsuccessfulCompletionWeeks: false,
          hasBlockFundingFeedbackError: false,
          eCertFailedValidations: [
            ECertFailedValidation.HasStopDisbursementInstitutionRestriction,
          ],
          eCertFailedValidationsInfo: {
            hasEffectiveAviationRestriction: false,
          },
        });
    },
  );

  it(
    "Should get application details with e-cert failed validation results having stop disbursement restriction and indicating effective aviation restriction" +
      " in the validations info when the application is for aviation credential type 'commercialPilotTraining'" +
      ` and the student has active restriction ${RestrictionCode.AVCP}.`,
    async () => {
      // Arrange
      const aviationCredentialType = "commercialPilotTraining";
      const student = await saveFakeStudent(db.dataSource);
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Signed,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      // Application for aviation credential type 'commercialPilotTraining'.
      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student, msfaaNumber },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
          offeringInitialValues: {
            isAviationOffering: "yes",
            aviationCredentialType,
          },
        },
      );
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;

      const restriction = await db.restriction.findOne({
        select: { id: true },
        where: {
          restrictionCode: RestrictionCode.AVCP,
        },
      });

      await saveFakeStudentRestriction(db.dataSource, {
        student,
        application,
        restriction,
      });

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
          hasActiveUnsuccessfulCompletionWeeks: false,
          hasBlockFundingFeedbackError: false,
          eCertFailedValidations: [
            ECertFailedValidation.HasStopDisbursementRestriction,
          ],
          eCertFailedValidationsInfo: { hasEffectiveAviationRestriction: true },
        });
    },
  );

  it(
    "Should get application details with no e-cert failed validation results" +
      " when the application is for aviation credential type 'commercialPilotTraining'" +
      ` but the student has active restriction for different credential type ${RestrictionCode.AVIR}.`,
    async () => {
      // Arrange
      const aviationCredentialType = "commercialPilotTraining";
      const student = await saveFakeStudent(db.dataSource);
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Signed,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      // Application for aviation credential type 'commercialPilotTraining'.
      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student, msfaaNumber },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
          offeringInitialValues: {
            isAviationOffering: "yes",
            aviationCredentialType,
          },
        },
      );
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;
      // Restriction for different aviation credential type.
      const restriction = await db.restriction.findOne({
        select: { id: true },
        where: {
          restrictionCode: RestrictionCode.AVIR,
        },
      });

      await saveFakeStudentRestriction(db.dataSource, {
        student,
        application,
        restriction,
      });

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
          hasActiveUnsuccessfulCompletionWeeks: false,
          hasBlockFundingFeedbackError: false,
          eCertFailedValidations: [],
        });
    },
  );

  it(
    "Should get application details with ecert failed validations array having invalid SIN when " +
      "the student doesn't have a valid SIN and the offering intensity is part time.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Signed,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        { student, msfaaNumber },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        },
      );
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;

      application.student.sinValidation.isValidSIN = false;
      await db.student.save(application.student);

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
          hasActiveUnsuccessfulCompletionWeeks: false,
          hasBlockFundingFeedbackError: false,
          eCertFailedValidations: [ECertFailedValidation.InvalidSIN],
          eCertFailedValidationsInfo: {
            hasEffectiveAviationRestriction: false,
          },
        });
    },
  );

  it(
    "Should get application details with ecert failed validations array having lifetime maximum CSLP when " +
      "the life time maximums CSLP value is less than the sum of disbursement CSLP value amount " +
      "and the latest CSLP balance and the offering intensity is part time.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
        },
        {
          msfaaState: MSFAAStates.Signed,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      // Mock user services to return the saved student.
      await mockUserLoginInfo(appModule, student);

      const application = await saveFakeApplicationDisbursements(
        appDataSource,
        {
          student,
          msfaaNumber,
          disbursementValues: [
            createFakeDisbursementValue(
              DisbursementValueType.CanadaLoan,
              CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE,
              10001,
            ),
          ],
        },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          },
        },
      );
      const [firstDisbursement] =
        application.currentAssessment.disbursementSchedules;

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
          hasActiveUnsuccessfulCompletionWeeks: false,
          hasBlockFundingFeedbackError: false,
          eCertFailedValidations: [ECertFailedValidation.LifetimeMaximumCSLP],
          eCertFailedValidationsInfo: {
            hasEffectiveAviationRestriction: false,
          },
        });
    },
  );

  it("Should get application with change request details when there is an in-progress change request pending Ministry approval.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    // Change request for the existing application.
    const changeRequestApplication = await saveFakeApplication(
      appDataSource,
      {
        student: sharedStudent,
        parentApplication: application,
        precedingApplication: application,
      },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
      },
    );

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
        hasActiveUnsuccessfulCompletionWeeks: false,
        hasBlockFundingFeedbackError: false,
        eCertFailedValidations: [],
        changeRequestInProgress: {
          applicationId: changeRequestApplication.id,
          applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
        },
      });
  });

  it("Should get application with change request details including waiting student income and waiting partner data when there is an in-progress change request with a partner associated.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    // Change request for the existing application.
    const changeRequestApplication = await saveFakeApplication(
      appDataSource,
      {
        student: sharedStudent,
        parentApplication: application,
        precedingApplication: application,
      },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
      },
    );
    // Create CRA income verifications for student.
    const studentCRAIncomeVerification = createFakeCRAIncomeVerification({
      application: changeRequestApplication,
      applicationEditStatusUpdatedBy: sharedStudent.user,
    });
    await db.craIncomeVerification.save(studentCRAIncomeVerification);
    // Create supporting users.
    const partner = createFakeSupportingUser(
      { application: changeRequestApplication },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Partner,
        },
      },
    );
    await db.supportingUser.save(partner);

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
        hasActiveUnsuccessfulCompletionWeeks: false,
        hasBlockFundingFeedbackError: false,
        eCertFailedValidations: [],
        changeRequestInProgress: {
          applicationId: changeRequestApplication.id,
          applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
          studentIncomeVerificationStatus: SuccessWaitingStatus.Waiting,
          partnerInfo: SuccessWaitingStatus.Waiting,
        },
      });
  });

  it("Should get application with change request details including a received student income, parent 1 waiting income, parent 2 waiting data when there is an in-progress change request with parents associated.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      appDataSource,
      { student: sharedStudent, msfaaNumber: sharedSignedMSFAANumber },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const [firstDisbursement] =
      application.currentAssessment.disbursementSchedules;
    // Change request for the existing application.
    const changeRequestApplication = await saveFakeApplication(
      appDataSource,
      {
        student: sharedStudent,
        parentApplication: application,
        precedingApplication: application,
      },
      {
        applicationStatus: ApplicationStatus.Edited,
        applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
      },
    );
    // Create supporting user parent 1 with data received waiting for income verification.
    const parentWaitingIncome = createFakeSupportingUser(
      { application: changeRequestApplication },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
          supportingData: { someDataReceived: "some value" },
        },
      },
    );
    // Create supporting user parent 2 waiting for its data.
    const parentWaitingData = createFakeSupportingUser(
      { application: changeRequestApplication },
      {
        initialValues: {
          supportingUserType: SupportingUserType.Parent,
        },
      },
    );
    await db.supportingUser.save([parentWaitingIncome, parentWaitingData]);
    // Create CRA income verifications for the student.
    const studentCompletedIncomeCRAVerification =
      createFakeCRAIncomeVerification(
        {
          application: changeRequestApplication,
        },
        {
          initialValues: { dateReceived: new Date() },
        },
      );
    // Create CRA income verifications for parent 1 waiting for income verification.
    const parentWaitingIncomeCRAVerification = createFakeCRAIncomeVerification({
      application: changeRequestApplication,
      supportingUser: parentWaitingIncome,
    });
    await db.craIncomeVerification.save([
      studentCompletedIncomeCRAVerification,
      parentWaitingIncomeCRAVerification,
    ]);

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
        hasActiveUnsuccessfulCompletionWeeks: false,
        hasBlockFundingFeedbackError: false,
        eCertFailedValidations: [],
        changeRequestInProgress: {
          applicationId: changeRequestApplication.id,
          applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
          studentIncomeVerificationStatus: SuccessWaitingStatus.Success,
          parent1IncomeVerificationStatus: SuccessWaitingStatus.Waiting,
          parentsInfo: [
            {
              supportingUserId: parentWaitingIncome.id,
              parentFullName: parentWaitingIncome.fullName,
              status: SuccessWaitingStatus.Success,
              isAbleToReport: parentWaitingIncome.isAbleToReport,
            },
            {
              supportingUserId: parentWaitingData.id,
              parentFullName: parentWaitingData.fullName,
              status: SuccessWaitingStatus.Waiting,
              isAbleToReport: parentWaitingData.isAbleToReport,
            },
          ],
        },
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
