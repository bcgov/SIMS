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
  createFakeDisbursementReceipt,
  createFakeDisbursementReceiptValue,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  DisbursementReceiptValue,
  DisbursementScheduleStatus,
  Institution,
  InstitutionLocation,
  OfferingIntensity,
} from "@sims/sims-db";
import { getDateOnlyFormat } from "@sims/utilities";
import { saveStudentApplicationForCollegeC } from "../../../student/_tests_/e2e/student.institutions.utils";
import { MASKED_MSFAA_NUMBER } from "../../../../../src/services";

describe("AssessmentInstitutionsController(e2e)-getAssessmentAwardDetails", () => {
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

  it("Should get the student award details for an eligible application when an eligible public institution user tries to access it.", async () => {
    // Arrange

    // Student has an application to the institution with award details.
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
        applicationStatus: ApplicationStatus.Completed,
        firstDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
        },
      },
    );
    const assessment = application.currentAssessment;
    const [firstDisbursementSchedule] =
      application.currentAssessment.disbursementSchedules;

    const disbursementReceipt = createFakeDisbursementReceipt({
      disbursementSchedule: firstDisbursementSchedule,
      institutionLocation: collegeFLocation,
    });
    await db.disbursementReceipt.save(disbursementReceipt);

    const awards = {};
    const disbursementReceiptsValues = [] as DisbursementReceiptValue[];
    firstDisbursementSchedule.disbursementValues.forEach((disbursement) => {
      awards[`disbursement1${disbursement.valueCode.toLowerCase()}`] =
        disbursement.valueAmount;
      disbursementReceiptsValues.push(
        createFakeDisbursementReceiptValue(
          {
            grantType: disbursement.valueCode,
            grantAmount: disbursement.valueAmount,
          },
          { disbursementReceipt },
        ),
      );
    });
    await db.disbursementReceiptValue.save(disbursementReceiptsValues);

    const finalAwards = {};

    disbursementReceiptsValues.forEach((disbursementReceiptsValue) => {
      finalAwards[
        `disbursementReceipt1${disbursementReceiptsValue.grantType.toLowerCase()}`
      ] = disbursementReceiptsValue.grantAmount;
    });

    const endpoint = `/institutions/assessment/student/${student.id}/application/${application.id}/assessment/${assessment.id}/award`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        applicationNumber: application.applicationNumber,
        applicationStatus: application.applicationStatus,
        institutionName:
          assessment.offering.educationProgram.institution.operatingName,
        offeringIntensity: assessment.offering.offeringIntensity,
        offeringStudyStartDate: getDateOnlyFormat(
          assessment.offering.studyStartDate,
        ),
        offeringStudyEndDate: getDateOnlyFormat(
          assessment.offering.studyEndDate,
        ),
        estimatedAward: {
          disbursement1Date: getDateOnlyFormat(
            firstDisbursementSchedule.disbursementDate,
          ),
          disbursement1Status:
            firstDisbursementSchedule.disbursementScheduleStatus,
          disbursement1COEStatus: firstDisbursementSchedule.coeStatus,
          disbursement1MSFAANumber: MASKED_MSFAA_NUMBER,
          disbursement1MSFAAId: firstDisbursementSchedule.msfaaNumber.id,
          disbursement1MSFAACancelledDate:
            firstDisbursementSchedule.msfaaNumber.cancelledDate,
          disbursement1MSFAADateSigned:
            firstDisbursementSchedule.msfaaNumber.dateSigned,
          disbursement1TuitionRemittance:
            firstDisbursementSchedule.tuitionRemittanceRequestedAmount,
          disbursement1Id: firstDisbursementSchedule.id,
          disbursement1DocumentNumber: firstDisbursementSchedule.documentNumber,
          ...awards,
        },
        finalAward: finalAwards,
      });
  });

  it("Should throw not found exception when assessment is not found.", async () => {
    // Arrange

    // Student.
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

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/assessment/student/${student.id}/application/${application.id}/assessment/9999999/award`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: 404,
        message: "Assessment not found.",
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
    const endpoint = `/institutions/assessment/student/${student.id}/application/${collegeCApplication.id}/assessment/9999999/award`;

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

    const endpoint = `/institutions/assessment/student/${student.id}/application/9999999/assessment/9999999/award`;

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
