import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
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
  createFakeDisbursementFeedbackError,
  saveFakeStudentRestriction,
  MSFAAStates,
  createFakeMSFAANumber,
} from "@sims/test-utils";
import {
  ApplicationOfferingChangeRequestStatus,
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  OfferingIntensity,
  RestrictionActionType,
  Student,
  StudentAppealStatus,
} from "@sims/sims-db";
import { ArrayContains } from "typeorm";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";

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

    const endpoint = `/students/application/99999999/progress-details`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND);
  });

  it("Should get the status of all requests and confirmations in student application (Appeals, Application Offering Change Requests and COE).", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
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
    await db.studentAppeal.save(approvedAppeal);
    // Create declined student appeal submitted today.
    const declinedAppealRequest = createFakeStudentAppealRequest();
    declinedAppealRequest.appealStatus = StudentAppealStatus.Declined;
    const declinedAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [declinedAppealRequest],
    });
    await db.studentAppeal.save(declinedAppeal);
    // Create pending student appeal submitted today.
    const pendingAppealRequest = createFakeStudentAppealRequest();
    pendingAppealRequest.appealStatus = StudentAppealStatus.Pending;
    const pendingAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [pendingAppealRequest],
    });
    await db.studentAppeal.save(pendingAppeal);
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
        firstCOEStatus: firstDisbursement.coeStatus,
        secondCOEStatus: secondDisbursement.coeStatus,
        appealStatus: StudentAppealStatus.Pending,
        applicationOfferingChangeRequestStatus:
          ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
        assessmentTriggerType: application.currentAssessment.triggerType,
        hasBlockFundingFeedbackError: false,
        hasEcertFailedValidations: false,
      });
  });

  it("Should get application progress details when the current assessment is impacted and the trigger type is 'Related application changed'.", async () => {
    // Arrange

    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.Completed,
        createSecondDisbursement: true,
      },
    );

    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;

    application.currentAssessment.triggerType =
      AssessmentTriggerType.RelatedApplicationChanged;
    await db.application.save(application);

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
        firstCOEStatus: firstDisbursement.coeStatus,
        secondCOEStatus: secondDisbursement.coeStatus,
        assessmentTriggerType: AssessmentTriggerType.RelatedApplicationChanged,
        hasBlockFundingFeedbackError: false,
        hasEcertFailedValidations: false,
      });
  });

  it(
    "Should get application progress details with feedback error status as false when the application has one or more feedback errors but none of them" +
      " block funding and the offering intensity is part-time.",
    async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
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
          firstCOEStatus: COEStatus.completed,
          assessmentTriggerType: application.currentAssessment.triggerType,
          hasBlockFundingFeedbackError: false,
          hasEcertFailedValidations: false,
        });
    },
  );

  it(
    "Should get application progress details with feedback error status as true when the application has one or more feedback errors" +
      " that block funding and the offering intensity is part-time.",
    async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
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
          firstCOEStatus: COEStatus.completed,
          assessmentTriggerType: application.currentAssessment.triggerType,
          hasBlockFundingFeedbackError: true,
          hasEcertFailedValidations: false,
        });
    },
  );

  it(
    "Should get application progress details with invalid disbursement as true when there are restrictions associated " +
      "with the current student and the offering intensity is part time.",
    async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
        {
          applicationStatus: ApplicationStatus.Completed,
          offeringIntensity: OfferingIntensity.partTime,
          firstDisbursementInitialValues: {
            coeStatus: COEStatus.completed,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          },
        },
      );
      const restriction = await db.restriction.findOne({
        where: {
          actionType: ArrayContains([
            RestrictionActionType.StopPartTimeDisbursement,
          ]),
        },
      });
      await saveFakeStudentRestriction(db.dataSource, {
        student,
        application,
        restriction,
      });

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
          firstCOEStatus: COEStatus.completed,
          assessmentTriggerType: application.currentAssessment.triggerType,
          hasBlockFundingFeedbackError: false,
          hasEcertFailedValidations: false,
        });
    },
  );

  it(
    "Should get application progress details with ecert failed validations array having invalid SIN for " +
      "an application with its first disbursement having pending schedule status when " +
      "the student's inValidSIN is false and the offering intensity is part time.",
    async () => {
      // Arrange
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        { student },
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

      const msfaaNumber = createFakeMSFAANumber(
        {
          student,
          referenceApplication: application,
        },
        {
          msfaaState: MSFAAStates.Signed,
        },
      );
      await db.msfaaNumber.save(msfaaNumber);

      firstDisbursement.msfaaNumber = msfaaNumber;
      await db.disbursementSchedule.save(firstDisbursement);

      student.sinValidation = createFakeSINValidation(
        {
          student,
        },
        { initialValue: { isValidSIN: false } },
      );
      await db.student.save(student);

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
          firstCOEStatus: COEStatus.completed,
          assessmentTriggerType: application.currentAssessment.triggerType,
          hasBlockFundingFeedbackError: false,
          hasEcertFailedValidations: true,
        });
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
