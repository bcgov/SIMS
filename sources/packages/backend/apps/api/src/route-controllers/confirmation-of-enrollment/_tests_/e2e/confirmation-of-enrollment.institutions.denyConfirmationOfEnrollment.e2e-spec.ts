import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  getReadOnlyCollegeEAuthorizedLocation,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  Institution,
  InstitutionLocation,
  OfferingIntensity,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { COE_WINDOW, addDays, getISODateOnlyString } from "@sims/utilities";

describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-denyConfirmationOfEnrollment", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeC: Institution;
  let collegeCLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);

    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    collegeCLocation = createFakeInstitutionLocation({ institution: collegeC });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
  });

  it("Should decline the COE with provided reason when institution decline a COE.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
      },
      { applicationStatus: ApplicationStatus.Enrolment },
    );
    const [firstDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/deny`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const coeDenyReasonId = 2;
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ coeDenyReasonId })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    // Check if the COE is declined and declined with the provided reason.
    const declinedCOE = await db.disbursementSchedule.findOne({
      select: { id: true, coeStatus: true, coeDeniedReason: { id: true } },
      relations: { coeDeniedReason: true },
      where: { id: firstDisbursementSchedule.id },
    });
    expect(declinedCOE.coeStatus).toBe(COEStatus.declined);
    expect(declinedCOE.coeDeniedReason.id).toBe(coeDenyReasonId);
  });

  it("Should not decline the COE when user is read-only.", async () => {
    // Arrange
    const collegeELocation = await getReadOnlyCollegeEAuthorizedLocation(db);
    const endpoint = `/institutions/location/${collegeELocation.id}/confirmation-of-enrollment/disbursement-schedule/9999999/deny`;
    const collegEInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeEReadOnlyUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(collegEInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  it(
    "Should decline the COE and create reassessment for impacted application(s) " +
      "when institution decline a COE and the application that belongs to COE being declined can potentially " +
      "impact one or more applications.",
    async () => {
      // Arrange

      // Create the student to be shared across the applications.
      const student = await saveFakeStudent(db.dataSource);
      // Application in the past that must be ignored.
      const applicationNotImpacted = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          institution: collegeC,
          institutionLocation: collegeCLocation,
        },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: addDays(-1),
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
        },
      );
      // Application to which COE is going to be declined.
      const applicationToDeclineCOE = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          institution: collegeC,
          institutionLocation: collegeCLocation,
        },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Enrolment,
          currentAssessmentInitialValues: {
            assessmentWorkflowId: "some fake id",
            assessmentDate: new Date(),
            studentAssessmentStatus: StudentAssessmentStatus.Completed,
          },
        },
      );
      // Application which is potentially impacted by any change the previous
      // application(application to which COE is going to be declined).
      const potentiallyImpactedApplication =
        await saveFakeApplicationDisbursements(
          db.dataSource,
          {
            student,
            institution: collegeC,
            institutionLocation: collegeCLocation,
          },
          {
            offeringIntensity: OfferingIntensity.partTime,
            applicationStatus: ApplicationStatus.Completed,
            currentAssessmentInitialValues: {
              assessmentWorkflowId: "some fake id",
              assessmentDate: addDays(1),
              studentAssessmentStatus: StudentAssessmentStatus.Submitted,
            },
          },
        );

      const [firstDisbursementSchedule] =
        applicationToDeclineCOE.currentAssessment.disbursementSchedules;
      const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/deny`;
      const token = await getInstitutionToken(
        InstitutionTokenTypes.CollegeCUser,
      );
      const coeDenyReasonId = 2;
      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send({ coeDenyReasonId })
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);
      // Check if the COE is declined and declined with the provided reason.
      const declinedCOE = await db.disbursementSchedule.findOne({
        select: { id: true, coeStatus: true, coeDeniedReason: { id: true } },
        relations: { coeDeniedReason: true },
        where: { id: firstDisbursementSchedule.id },
      });
      expect(declinedCOE.coeStatus).toBe(COEStatus.declined);
      expect(declinedCOE.coeDeniedReason.id).toBe(coeDenyReasonId);

      // Check if the application(s) impacted by COE being declined received a
      // related application reassessment.
      const impactedApplicationCurrentAssessment =
        await getApplicationCurrentAssessment(
          potentiallyImpactedApplication.id,
        );
      expect(
        impactedApplicationCurrentAssessment.currentAssessment.triggerType,
      ).toBe(AssessmentTriggerType.RelatedApplicationChanged);
      expect(
        impactedApplicationCurrentAssessment.currentAssessment
          .relatedApplicationAssessment.id,
      ).toBe(applicationToDeclineCOE.currentAssessment.id);

      // Check if the application which is NOT impacted by COE being declined
      // should not receive a related application reassessment.
      const notImpactedApplicationCurrentAssessment =
        await getApplicationCurrentAssessment(applicationNotImpacted.id);
      expect(
        notImpactedApplicationCurrentAssessment.currentAssessment.triggerType,
      ).not.toBe(AssessmentTriggerType.RelatedApplicationChanged);
    },
  );

  it("Should decline first and the second COEs and cancel first and the second disbursements when the institution declines the first COE.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
      },
      {
        createSecondDisbursement: true,
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Enrolment,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.required,
          disbursementDate: getISODateOnlyString(new Date()),
        },
        secondDisbursementInitialValues: {
          coeStatus: COEStatus.required,
          disbursementDate: getISODateOnlyString(addDays(30)),
        },
      },
    );

    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursement.id}/deny`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const coeDenyReasonId = 2;
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ coeDenyReasonId })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Check if the COEs are declined and the expected fields are updated.
    const [firstDisbursementSaved, secondDisbursementSaved] =
      await db.disbursementSchedule.find({
        select: {
          id: true,
          coeStatus: true,
          coeDeniedReason: { id: true },
          disbursementScheduleStatus: true,
          coeUpdatedBy: {
            id: true,
          },
          modifier: {
            id: true,
          },
          coeUpdatedAt: true,
          updatedAt: true,
        },
        relations: {
          coeDeniedReason: true,
          coeUpdatedBy: true,
          modifier: true,
        },
        where: { studentAssessment: { id: application.currentAssessment.id } },
        order: { disbursementDate: "ASC" },
      });
    // Values expected to be the same among the saved disbursements.
    const sharedExpectedSavedValues = {
      coeStatus: COEStatus.declined,
      coeDeniedReason: {
        id: coeDenyReasonId,
      },
      disbursementScheduleStatus: DisbursementScheduleStatus.Cancelled,
      coeUpdatedBy: {
        id: expect.any(Number),
      },
      modifier: {
        id: expect.any(Number),
      },
      coeUpdatedAt: expect.any(Date),
      updatedAt: expect.any(Date),
    };
    expect(firstDisbursementSaved).toEqual({
      id: firstDisbursement.id,
      ...sharedExpectedSavedValues,
    });
    expect(secondDisbursementSaved).toEqual({
      id: secondDisbursement.id,
      ...sharedExpectedSavedValues,
    });
    expect(firstDisbursementSaved.modifier.id).toBe(
      secondDisbursementSaved.modifier.id,
    );
    expect(firstDisbursementSaved.coeUpdatedBy.id).toBe(
      secondDisbursementSaved.coeUpdatedBy.id,
    );
    expect(firstDisbursementSaved.coeUpdatedAt).toEqual(
      secondDisbursementSaved.coeUpdatedAt,
    );
    expect(firstDisbursementSaved.updatedAt).toEqual(
      secondDisbursementSaved.updatedAt,
    );
  });

  it("Should decline the second COE and cancel the second disbursement when the institution declines the second COE.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
      },
      {
        createSecondDisbursement: true,
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.completed,
          disbursementDate: getISODateOnlyString(new Date()),
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
        secondDisbursementInitialValues: {
          coeStatus: COEStatus.required,
          disbursementDate: getISODateOnlyString(addDays(COE_WINDOW - 1)),
        },
      },
    );

    const [firstDisbursement, secondDisbursement] =
      application.currentAssessment.disbursementSchedules;
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${secondDisbursement.id}/deny`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const coeDenyReasonId = 2;
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ coeDenyReasonId })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Check if the second COE is declined and the expected fields are updated.
    const [firstDisbursementSaved, secondDisbursementSaved] =
      await db.disbursementSchedule.find({
        select: {
          id: true,
          coeStatus: true,
          coeDeniedReason: { id: true },
          disbursementScheduleStatus: true,
        },
        relations: { coeDeniedReason: true },
        where: { studentAssessment: { id: application.currentAssessment.id } },
        order: { disbursementDate: "ASC" },
      });
    // First disbursement should not have the values updated.
    expect(firstDisbursementSaved).toEqual({
      id: firstDisbursement.id,
      coeStatus: COEStatus.completed,
      disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
      coeDeniedReason: null,
    });
    // Second disbursement main updated values.
    expect(secondDisbursementSaved).toEqual({
      id: secondDisbursement.id,
      coeStatus: COEStatus.declined,
      disbursementScheduleStatus: DisbursementScheduleStatus.Cancelled,
      coeDeniedReason: {
        id: coeDenyReasonId,
      },
    });
  });

  it("Should throw NotFoundException when COE doesn't have estimated awards.", async () => {
    // Arrange
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        institution: collegeC,
        institutionLocation: collegeCLocation,
      },
      {
        applicationStatus: ApplicationStatus.Enrolment,
        firstDisbursementInitialValues: { hasEstimatedAwards: false },
      },
    );
    const [firstDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;
    const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/deny`;
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const coeDenyReasonId = 2;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ coeDenyReasonId })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Enrolment not found.",
        error: "Not Found",
      });
  });

  /**
   * Get application current assessment details to
   * assert the persisted details of current assessment.
   * @param applicationId application to be find.
   * @returns application current assessment details.
   */
  async function getApplicationCurrentAssessment(
    applicationId: number,
  ): Promise<Application> {
    return db.application.findOne({
      select: {
        id: true,
        currentAssessment: {
          id: true,
          triggerType: true,
          relatedApplicationAssessment: { id: true },
        },
      },
      relations: {
        currentAssessment: { relatedApplicationAssessment: true },
      },
      where: { id: applicationId },
    });
  }

  afterAll(async () => {
    await app?.close();
  });
});
