import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
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
  Institution,
  InstitutionLocation,
  OfferingIntensity,
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { addDays } from "@sims/utilities";

describe("ConfirmationOfEnrollmentInstitutionsController(e2e)-confirmEnrollment", () => {
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
    const coeDenyReasonId = 2;
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ coeDenyReasonId })
      .auth(
        await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
        BEARER_AUTH_TYPE,
      )
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

  it(
    "Should decline the COE and create reassessment for impacted application(s) " +
      "when institution decline a COE and COE of the application being declined can potentially " +
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
            assessmentDate: addDays(-1, new Date()),
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
              assessmentDate: addDays(1, new Date()),
              studentAssessmentStatus: StudentAssessmentStatus.Submitted,
            },
          },
        );

      const [firstDisbursementSchedule] =
        applicationToDeclineCOE.currentAssessment.disbursementSchedules;
      const endpoint = `/institutions/location/${collegeCLocation.id}/confirmation-of-enrollment/disbursement-schedule/${firstDisbursementSchedule.id}/deny`;
      const coeDenyReasonId = 2;
      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send({ coeDenyReasonId })
        .auth(
          await getInstitutionToken(InstitutionTokenTypes.CollegeCUser),
          BEARER_AUTH_TYPE,
        )
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
