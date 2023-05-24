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
  Assessment,
  AssessmentStatus,
  Institution,
  InstitutionLocation,
} from "@sims/sims-db";
import { getDateOnlyFormat, getUserFullName } from "@sims/utilities";
import { MASKED_MSFAA_NUMBER } from "@sims/services/constants";
import { saveStudentApplicationForCollegeC } from "../../../student/_tests_/e2e/student.institutions.utils";

jest.setTimeout(99999999);

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
    collegeFLocation = createFakeInstitutionLocation(collegeF);
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it("Should get the student noa details for an eligible application when an eligible public institution user tries to access it.", async () => {
    // Arrange

    // Student has an application to the institution eligible for NOA.
    const student = await saveFakeStudent(db.dataSource);

    const currentMSFAA = createFakeMSFAANumber(
      { student },
      {
        state: MSFAAStates.Signed,
      },
    );
    await db.msfaaNumber.save(currentMSFAA);
    const application = await saveFakeApplicationDisbursements(db.dataSource, {
      institution: collegeF,
      institutionLocation: collegeFLocation,
      student,
      msfaaNumber: currentMSFAA,
    });
    const assessment = application.currentAssessment;
    const [firstDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;

    const awards = {};
    firstDisbursementSchedule.disbursementValues.forEach((disbursement) => {
      awards[`disbursement1${disbursement.valueCode.toLowerCase()}`] =
        disbursement.valueAmount;
    });

    const endpoint = `/institutions/assessment/student/${student.id}/assessment/${assessment.id}/noa`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const savedAssessmentDetails = getSavedAssessmentDetails(
      assessment.assessmentData,
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
        assessment: savedAssessmentDetails,
        disbursement: {
          disbursement1COEStatus: firstDisbursementSchedule.coeStatus,
          disbursement1Date: getDateOnlyFormat(
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
          ...("disbursement1bcsl" in awards && {
            disbursement1bcsl: awards.disbursement1bcsl,
          }),
          ...("disbursement1csgf" in awards && {
            disbursement1csgf: awards.disbursement1csgf,
          }),
          ...("disbursement1cslf" in awards && {
            disbursement1cslf: awards.disbursement1cslf,
          }),
        },
        fullName: getUserFullName(application.student.user),
        locationName: assessment.offering.institutionLocation.name,
        noaApprovalStatus: assessment.noaApprovalStatus,
        offeringIntensity: assessment.offering.offeringIntensity,
        offeringStudyEndDate: getDateOnlyFormat(
          assessment.offering.studyEndDate,
        ),
        offeringStudyStartDate: getDateOnlyFormat(
          assessment.offering.studyStartDate,
        ),
        programName: assessment.offering.educationProgram.name,
      });
  });

  it("Should throw unprocessable entity exception when assessment data is not found.", async () => {
    // Arrange

    // Student has an application to the institution eligible for NOA.
    const student = await saveFakeStudent(db.dataSource);

    const currentMSFAA = createFakeMSFAANumber(
      { student },
      {
        state: MSFAAStates.Signed,
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
    const endpoint = `/institutions/assessment/student/${student.id}/assessment/${application.currentAssessment.id}/noa`;
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
        state: MSFAAStates.Signed,
      },
    );
    await db.msfaaNumber.save(currentMSFAA);
    const application = await saveFakeApplicationDisbursements(db.dataSource, {
      institution: collegeF,
      institutionLocation: collegeFLocation,
      student,
      msfaaNumber: currentMSFAA,
    });

    const endpoint = `/institutions/assessment/student/${student.id}/assessment/9999/noa`;
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
    const endpoint = `/institutions/assessment/student/${student.id}/assessment/9999/noa`;

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

    const endpoint = `/institutions/assessment/student/${student.id}/assessment/9999/noa`;

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
   * Get the saved formatted assessment details.
   * @param assessmentData assessment data.
   * @returns a assessment details object as
   * returned by the noa endpoint.
   */
  function getSavedAssessmentDetails(
    assessmentData: Assessment,
  ): Record<string, string | number> {
    return {
      ...(assessmentData.alimonyOrChildSupport && {
        alimonyOrChildSupport: assessmentData.alimonyOrChildSupport,
      }),
      ...(assessmentData.booksAndSuppliesCost && {
        booksAndSuppliesCost: assessmentData.booksAndSuppliesCost,
      }),
      ...(assessmentData.childcareCost && {
        childcareCost: assessmentData.childcareCost,
      }),
      ...(assessmentData.exceptionalEducationCost && {
        exceptionalEducationCost: assessmentData.exceptionalEducationCost,
      }),
      ...(assessmentData.federalAssessmentNeed && {
        federalAssessmentNeed: assessmentData.federalAssessmentNeed,
      }),
      ...(assessmentData.livingAllowance && {
        livingAllowance: assessmentData.livingAllowance,
      }),
      ...(assessmentData.otherAllowableCost && {
        otherAllowableCost: assessmentData.otherAllowableCost,
      }),
      ...(assessmentData.parentAssessedContribution && {
        parentAssessedContribution: assessmentData.parentAssessedContribution,
      }),
      ...(assessmentData.partnerAssessedContribution && {
        partnerAssessedContribution: assessmentData.partnerAssessedContribution,
      }),
      ...(assessmentData.provincialAssessmentNeed && {
        provincialAssessmentNeed: assessmentData.provincialAssessmentNeed,
      }),
      ...(assessmentData.secondResidenceCost && {
        secondResidenceCost: assessmentData.secondResidenceCost,
      }),
      ...(assessmentData.studentTotalFederalContribution && {
        studentTotalFederalContribution:
          assessmentData.studentTotalFederalContribution,
      }),
      ...(assessmentData.studentTotalProvincialContribution && {
        studentTotalProvincialContribution:
          assessmentData.studentTotalProvincialContribution,
      }),
      ...(assessmentData.totalAssessedCost && {
        totalAssessedCost: assessmentData.totalAssessedCost,
      }),
      ...(assessmentData.totalAssessmentNeed && {
        totalAssessmentNeed: assessmentData.totalAssessmentNeed,
      }),
      ...(assessmentData.totalFamilyIncome && {
        totalFamilyIncome: assessmentData.totalFamilyIncome,
      }),
      ...(assessmentData.totalFederalAward && {
        totalFederalAward: assessmentData.totalFederalAward,
      }),
      ...(assessmentData.totalFederalContribution && {
        totalFederalContribution: assessmentData.totalFederalContribution,
      }),
      ...(assessmentData.totalProvincialAward && {
        totalProvincialAward: assessmentData.totalProvincialAward,
      }),
      ...(assessmentData.totalProvincialContribution && {
        totalProvincialContribution: assessmentData.totalProvincialContribution,
      }),
      ...(assessmentData.transportationCost && {
        transportationCost: assessmentData.transportationCost,
      }),
      ...(assessmentData.tuitionCost && {
        tuitionCost: assessmentData.tuitionCost,
      }),
      ...(assessmentData.weeks && {
        weeks: assessmentData.weeks,
      }),
    };
  }

  afterAll(async () => {
    await app?.close();
  });
});
