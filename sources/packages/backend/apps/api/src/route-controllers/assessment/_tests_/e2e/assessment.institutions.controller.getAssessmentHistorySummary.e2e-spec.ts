import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
  INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import {
  createFakeInstitutionLocation,
  saveFakeStudent,
  saveFakeApplicationDisbursements,
  createFakeMSFAANumber,
  MSFAAStates,
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentScholasticStanding,
  createFakeUser,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  Institution,
  InstitutionLocation,
  StudentAssessmentStatus,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import { saveStudentApplicationForCollegeC } from "../../../student/_tests_/e2e/student.institutions.utils";

describe("AssessmentInstitutionsController(e2e)-getAssessmentHistorySummary", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // College F.
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it("Should get the student assessment history summary for an eligible application when an eligible public institution user tries to access it.", async () => {
    // Arrange

    // Student has an application to the institution.
    const student = await saveFakeStudent(db.dataSource);

    const currentMSFAA = createFakeMSFAANumber(
      { student },
      {
        msfaaState: MSFAAStates.Signed,
      },
    );
    await db.msfaaNumber.save(currentMSFAA);
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        institution: collegeF,
        institutionLocation: collegeFLocation,
        student,
        msfaaNumber: currentMSFAA,
      },
      { applicationStatus: ApplicationStatus.Completed },
    );
    const originalAssessment = application.currentAssessment;
    const submittedByInstitutionUser = await db.user.save(createFakeUser());

    // Create a scholastic standing for the completed application.
    const scholasticStanding = createFakeStudentScholasticStanding({
      submittedBy: submittedByInstitutionUser,
      application,
    });
    scholasticStanding.unsuccessfulWeeks = 10;
    await db.studentScholasticStanding.save(scholasticStanding);

    const endpoint = `/institutions/assessment/student/${student.id}/application/${application.id}/history`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          submittedDate: scholasticStanding.submittedDate.toISOString(),
          triggerType: AssessmentTriggerType.ScholasticStandingChange,
          status: StudentAssessmentStatus.Completed,
          studentScholasticStandingId: scholasticStanding.id,
          hasUnsuccessfulWeeks: true,
          scholasticStandingChangeType:
            StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
          scholasticStandingReversalDate: null,
        },
        {
          assessmentId: originalAssessment.id,
          submittedDate: originalAssessment.submittedDate.toISOString(),
          triggerType: AssessmentTriggerType.OriginalAssessment,
          assessmentDate: originalAssessment.assessmentDate,
          status: StudentAssessmentStatus.Submitted,
          offeringId: originalAssessment.offering.id,
          programId: originalAssessment.offering.educationProgram.id,
        },
      ]);
  });

  it("Should throw forbidden error when the institution type is not BC Public.", async () => {
    // Arrange
    // Student submitting an application to College C.
    const { student, collegeCApplication } =
      await saveStudentApplicationForCollegeC(db.dataSource);

    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCApplication.location,
    );

    // College C is not a BC Public institution.
    const collegeCInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const endpoint = `/institutions/assessment/student/${student.id}/application/9999999/history`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(collegeCInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: INSTITUTION_BC_PUBLIC_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  it("Should throw forbidden error when student does not have at least one application submitted for the institution.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);

    // College F is a BC Public institution.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/assessment/student/${student.id}/application/9999999/history`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: INSTITUTION_STUDENT_DATA_ACCESS_ERROR_MESSAGE,
        error: "Forbidden",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
