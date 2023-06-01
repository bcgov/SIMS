import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  authorizeUserTokenForLocation,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
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
  createFakeStudentAppealRequest,
  createFakeStudentAppeal,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  Institution,
  InstitutionLocation,
  StudentAppealStatus,
} from "@sims/sims-db";
import { saveStudentApplicationForCollegeC } from "../../../student/_tests_/e2e/student.institutions.utils";
import { createFakeOfferingRequestChange } from "@sims/test-utils/factories/offering-change-request";
import { RequestAssessmentTypeAPIOutDTO } from "../../models/assessment.dto";

describe("AssessmentInstitutionsController(e2e)-getRequestedAssessmentSummary", () => {
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
    collegeFLocation = createFakeInstitutionLocation(collegeF);
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it("Should get the student assessment requests summary for an eligible application when an eligible public institution user tries to access it.", async () => {
    // Arrange

    // Student has an application to the institution.
    const student = await saveFakeStudent(db.dataSource);

    const currentMSFAA = createFakeMSFAANumber(
      { student },
      {
        state: MSFAAStates.Signed,
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

    // Create pending student appeal submitted.
    const pendingAppealRequest = createFakeStudentAppealRequest();
    pendingAppealRequest.appealStatus = StudentAppealStatus.Pending;
    const pendingAppeal = createFakeStudentAppeal({
      application,
      appealRequests: [pendingAppealRequest],
    });
    await db.studentAppeal.save(pendingAppeal);

    const endpoint = `/institutions/assessment/student/${student.id}/application/${application.id}/requests`;
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
          id: pendingAppeal.id,
          submittedDate: pendingAppeal.submittedDate.toISOString(),
          status: StudentAppealStatus.Pending,
          requestType: AssessmentTriggerType.StudentAppeal,
        },
      ]);
  });

  it(
    "Should not get the 'offering change' assessment requests details in the request summary " +
      "for an eligible application when an eligible public institution user tries to access it and " +
      "student offering change is pending with the ministry.",
    async () => {
      // Arrange

      // Student has an application to the institution.
      const student = await saveFakeStudent(db.dataSource);

      const currentMSFAA = createFakeMSFAANumber(
        { student },
        {
          state: MSFAAStates.Signed,
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

      // Create pending offering change.
      const offeringRequestOfferings = createFakeOfferingRequestChange({
        currentOffering: application.currentAssessment.offering,
      });
      const [, requestedOffering] = await db.educationProgramOffering.save(
        offeringRequestOfferings,
      );
      const endpoint = `/institutions/assessment/student/${student.id}/application/${application.id}/requests`;
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect([]);

      // Checking the same scenario with the ministry user, to make sure that a fake offering change was created.
      // Arrange.
      const ministryEndpoint = `/aest/assessment/application/${application.id}/requests`;
      const ministryToken = await getAESTToken(
        AESTGroups.BusinessAdministrators,
      );
      // Act/Assert
      await request(app.getHttpServer())
        .get(ministryEndpoint)
        .auth(ministryToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect([
          {
            id: requestedOffering.id,
            submittedDate: requestedOffering.submittedDate.toISOString(),
            status: requestedOffering.offeringStatus,
            requestType: RequestAssessmentTypeAPIOutDTO.OfferingRequest,
            programId: requestedOffering.educationProgram.id,
          },
        ]);
    },
  );

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
    const endpoint = `/institutions/assessment/student/${student.id}/application/9999999/requests`;

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

    const endpoint = `/institutions/assessment/student/${student.id}/application/9999999/requests`;

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
