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
} from "@sims/test-utils";
import {
  AssessmentStatus,
  DisbursementSchedule,
  Institution,
  InstitutionLocation,
  OfferingIntensity,
} from "@sims/sims-db";
import { MASKED_MSFAA_NUMBER } from "../../../../../src/services";
import { saveStudentApplicationForCollegeC } from "../../../student/_tests_/e2e/student.institutions.utils";
import { getUserFullName } from "../../../../utilities";
import { getDateOnlyFullMonthFormat } from "@sims/utilities";

describe("AssessmentInstitutionsController(e2e)-getAssessmentNOA", () => {
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

  it("Should get the student noa details for an eligible full time application when an eligible public institution user tries to access it.", async () => {
    // Arrange

    // Student has an application to the institution eligible for NOA.
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
      {
        offeringIntensity: OfferingIntensity.fullTime,
        createSecondDisbursement: true,
      },
    );
    const assessment = application.currentAssessment;
    const [firstDisbursementSchedule, secondDisbursementSchedule] =
      assessment.disbursementSchedules;

    const firstDisbursementScheduleAwards = createNOADisbursementScheduleAwards(
      firstDisbursementSchedule,
      1,
    );

    const secondDisbursementScheduleAwards =
      createNOADisbursementScheduleAwards(secondDisbursementSchedule, 2);

    const endpoint = `/institutions/assessment/student/${student.id}/application/${application.id}/assessment/${assessment.id}/noa`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        applicationStatus: application.applicationStatus,
        assessment: assessment.assessmentData,
        disbursement: {
          disbursement1COEStatus: firstDisbursementSchedule.coeStatus,
          disbursement1Date: getDateOnlyFullMonthFormat(
            firstDisbursementSchedule.disbursementDate,
          ),
          disbursement1Id: firstDisbursementSchedule.id,
          disbursement1MSFAACancelledDate:
            firstDisbursementSchedule.msfaaNumber?.cancelledDate,
          disbursement1MSFAADateSigned:
            firstDisbursementSchedule.msfaaNumber?.dateSigned,
          disbursement1MSFAAId: firstDisbursementSchedule.msfaaNumber?.id,
          disbursement1MSFAANumber: MASKED_MSFAA_NUMBER,
          disbursement1Status:
            firstDisbursementSchedule.disbursementScheduleStatus,
          disbursement1TuitionRemittance:
            firstDisbursementSchedule.tuitionRemittanceRequestedAmount,
          ...firstDisbursementScheduleAwards,
          disbursement2COEStatus: secondDisbursementSchedule.coeStatus,
          disbursement2Date: getDateOnlyFullMonthFormat(
            secondDisbursementSchedule.disbursementDate,
          ),
          disbursement2Id: secondDisbursementSchedule.id,
          disbursement2MSFAACancelledDate:
            secondDisbursementSchedule.msfaaNumber?.cancelledDate,
          disbursement2MSFAADateSigned:
            secondDisbursementSchedule.msfaaNumber?.dateSigned,
          disbursement2MSFAAId: secondDisbursementSchedule.msfaaNumber?.id,
          disbursement2MSFAANumber: MASKED_MSFAA_NUMBER,
          disbursement2Status:
            secondDisbursementSchedule.disbursementScheduleStatus,
          disbursement2TuitionRemittance:
            secondDisbursementSchedule.tuitionRemittanceRequestedAmount,
          ...secondDisbursementScheduleAwards,
        },
        eligibleAmount: 2,
        fullName: getUserFullName(application.student.user),
        locationName: assessment.offering.institutionLocation.name,
        noaApprovalStatus: assessment.noaApprovalStatus,
        applicationCurrentAssessmentId: application.currentAssessment.id,
        offeringIntensity: assessment.offering.offeringIntensity,
        offeringStudyEndDate: getDateOnlyFullMonthFormat(
          assessment.offering.studyEndDate,
        ),
        offeringStudyStartDate: getDateOnlyFullMonthFormat(
          assessment.offering.studyStartDate,
        ),
        programName: assessment.offering.educationProgram.name,
        offeringName: assessment.offering.name,
      });
  });

  it("Should get the student noa details for an eligible part time application when an eligible public institution user tries to access it.", async () => {
    // Arrange

    // Student has an application to the institution eligible for NOA.
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
      {
        offeringIntensity: OfferingIntensity.partTime,
        createSecondDisbursement: true,
      },
    );
    const assessment = application.currentAssessment;
    const [firstDisbursementSchedule, secondDisbursementSchedule] =
      assessment.disbursementSchedules;

    const firstDisbursementScheduleAwards = createNOADisbursementScheduleAwards(
      firstDisbursementSchedule,
      1,
    );

    const secondDisbursementScheduleAwards =
      createNOADisbursementScheduleAwards(secondDisbursementSchedule, 2);

    const endpoint = `/institutions/assessment/student/${student.id}/application/${application.id}/assessment/${assessment.id}/noa`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        applicationStatus: application.applicationStatus,
        assessment: assessment.assessmentData,
        disbursement: {
          disbursement1COEStatus: firstDisbursementSchedule.coeStatus,
          disbursement1Date: getDateOnlyFullMonthFormat(
            firstDisbursementSchedule.disbursementDate,
          ),
          disbursement1Id: firstDisbursementSchedule.id,
          disbursement1MSFAACancelledDate:
            firstDisbursementSchedule.msfaaNumber?.cancelledDate,
          disbursement1MSFAADateSigned:
            firstDisbursementSchedule.msfaaNumber?.dateSigned,
          disbursement1MSFAAId: firstDisbursementSchedule.msfaaNumber?.id,
          disbursement1MSFAANumber: MASKED_MSFAA_NUMBER,
          disbursement1Status:
            firstDisbursementSchedule.disbursementScheduleStatus,
          disbursement1TuitionRemittance:
            firstDisbursementSchedule.tuitionRemittanceRequestedAmount,
          ...firstDisbursementScheduleAwards,
          disbursement2COEStatus: secondDisbursementSchedule.coeStatus,
          disbursement2Date: getDateOnlyFullMonthFormat(
            secondDisbursementSchedule.disbursementDate,
          ),
          disbursement2Id: secondDisbursementSchedule.id,
          disbursement2MSFAACancelledDate:
            secondDisbursementSchedule.msfaaNumber?.cancelledDate,
          disbursement2MSFAADateSigned:
            secondDisbursementSchedule.msfaaNumber?.dateSigned,
          disbursement2MSFAAId: secondDisbursementSchedule.msfaaNumber?.id,
          disbursement2MSFAANumber: MASKED_MSFAA_NUMBER,
          disbursement2Status:
            secondDisbursementSchedule.disbursementScheduleStatus,
          disbursement2TuitionRemittance:
            secondDisbursementSchedule.tuitionRemittanceRequestedAmount,
          ...secondDisbursementScheduleAwards,
        },
        eligibleAmount: 2,
        fullName: getUserFullName(application.student.user),
        locationName: assessment.offering.institutionLocation.name,
        noaApprovalStatus: assessment.noaApprovalStatus,
        applicationCurrentAssessmentId: application.currentAssessment.id,
        offeringIntensity: assessment.offering.offeringIntensity,
        offeringStudyEndDate: getDateOnlyFullMonthFormat(
          assessment.offering.studyEndDate,
        ),
        offeringStudyStartDate: getDateOnlyFullMonthFormat(
          assessment.offering.studyStartDate,
        ),
        programName: assessment.offering.educationProgram.name,
        offeringName: assessment.offering.name,
      });
  });

  it("Should throw unprocessable entity exception when assessment data is not found.", async () => {
    // Arrange
    // Student has an application to the institution eligible for NOA.
    const student = await saveFakeStudent(db.dataSource);

    const currentMSFAA = createFakeMSFAANumber(
      { student },
      {
        msfaaState: MSFAAStates.Signed,
      },
    );
    await db.msfaaNumber.save(currentMSFAA);
    const application = await saveFakeApplicationDisbursements(db.dataSource, {
      institution: collegeF,
      institutionLocation: collegeFLocation,
      student,
      msfaaNumber: currentMSFAA,
    });
    application.currentAssessment.noaApprovalStatus = AssessmentStatus.required;
    application.currentAssessment.assessmentData = null;
    await db.application.save(application);
    const endpoint = `/institutions/assessment/student/${student.id}/application/${application.id}/assessment/${application.currentAssessment.id}/noa`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: 422,
        message: "Notice of assessment data is not present.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw not found exception when assessment is not found.", async () => {
    // Arrange
    // Student has an application to the institution eligible for NOA.
    const student = await saveFakeStudent(db.dataSource);
    const currentMSFAA = createFakeMSFAANumber(
      { student },
      {
        msfaaState: MSFAAStates.Signed,
      },
    );
    await db.msfaaNumber.save(currentMSFAA);
    const application = await saveFakeApplicationDisbursements(db.dataSource, {
      institution: collegeF,
      institutionLocation: collegeFLocation,
      student,
      msfaaNumber: currentMSFAA,
    });

    const endpoint = `/institutions/assessment/student/${student.id}/application/${application.id}/assessment/9999999/noa`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Assessment was not found.",
        error: "Not Found",
      });
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
    const endpoint = `/institutions/assessment/student/${student.id}/application/${collegeCApplication.id}/assessment/9999999/noa`;

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

    const endpoint = `/institutions/assessment/student/${student.id}/application/9999999/assessment/9999999/noa`;

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

  /**
   * Disbursement awards.
   */
  interface DisbursementAwards {
    [disbursementValueCode: string]: number;
  }

  /**
   * Creates disbursement schedule awards based on the given schedule and disbursement number.
   * @param disbursementSchedule Disbursement schedule containing disbursement values.
   * @param disbursementNumber Number associated with the disbursement schedule (e.g., 1 for the first, 2 for the second).
   * @returns Disbursement awards with keys like 'disbursement1code' and values as amounts.
   */
  function createNOADisbursementScheduleAwards(
    disbursementSchedule: DisbursementSchedule,
    disbursementNumber: 1 | 2,
  ): DisbursementAwards {
    const disbursementScheduleAwards: DisbursementAwards = {};

    disbursementSchedule.disbursementValues.forEach((disbursementValue) => {
      disbursementScheduleAwards[
        `disbursement${disbursementNumber}${disbursementValue.valueCode.toLowerCase()}`
      ] = disbursementValue.valueAmount;
    });

    return disbursementScheduleAwards;
  }

  afterAll(async () => {
    await app?.close();
  });
});
