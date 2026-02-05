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
  createFakeDisbursementValue,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  DisbursementScheduleStatus,
  DisbursementValueType,
  Institution,
  InstitutionLocation,
  MSFAANumber,
  OfferingIntensity,
  Student,
} from "@sims/sims-db";
import {
  addDays,
  getDateOnlyFormat,
  getDateOnlyFullMonthFormat,
} from "@sims/utilities";
import { saveStudentApplicationForCollegeC } from "../../../student/_tests_/e2e/student.institutions.utils";
import { MASKED_MSFAA_NUMBER } from "../../../../../src/services";

describe("AssessmentInstitutionsController(e2e)-getAssessmentAwardDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let sharedStudent: Student;
  let sharedMSFAANumber: MSFAANumber;

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
    // Shared student to be used for tests that would not need further student customization.
    sharedStudent = await saveFakeStudent(db.dataSource);
    // Valid MSFAA Number that will be part of the expected returned values.
    sharedMSFAANumber = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        { student: sharedStudent },
        { msfaaState: MSFAAStates.Signed },
      ),
    );
  });

  it(
    "Should get the student award details (including subtracted amounts) for an eligible Part-time application " +
      "when the e-Cert was sent and an eligible public institution user tries to access it.",
    async () => {
      // Arrange
      const enrolmentDate1 = addDays(1);
      const statusUpdatedOn = new Date();

      // First disbursement values.
      const firstDisbursementValues = [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLP",
          100,
          { effectiveAmount: 100 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          200,
          // Final amount has been reduced by a $5 disbursed amount.
          { effectiveAmount: 195, disbursedAmountSubtracted: 5 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSPT",
          300,
          { effectiveAmount: 300 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGD",
          400,
          // Final amount has been modified by a $-15 overaward amount and a $10 restriction amount.
          {
            effectiveAmount: 405,
            overawardAmountSubtracted: 15,
            restrictionAmountSubtracted: 10,
          },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "BCAG",
          500,
          {
            effectiveAmount: 500,
          },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "SBSD",
          600,
          {
            effectiveAmount: 600,
          },
        ),
        // Must be ignored in the result even being present with an effective value.
        createFakeDisbursementValue(
          DisbursementValueType.BCTotalGrant,
          "BCSG",
          500 + 600,
          { effectiveAmount: 500 + 600 },
        ),
      ];

      // Student has a Full-time application to the institution with award details.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          institution: collegeF,
          institutionLocation: collegeFLocation,
          student: sharedStudent,
          msfaaNumber: sharedMSFAANumber,
          firstDisbursementValues,
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          firstDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            dateSent: new Date(),
            coeUpdatedAt: enrolmentDate1,
            disbursementScheduleStatusUpdatedOn: statusUpdatedOn,
          },
        },
      );
      // Add a Disbursement Receipt for the first disbursement schedule.
      const assessment = application.currentAssessment;
      const [firstDisbursementSchedule] = assessment.disbursementSchedules;
      const disbursementReceipt = createFakeDisbursementReceipt({
        disbursementSchedule: firstDisbursementSchedule,
        institutionLocation: collegeFLocation,
      });
      await db.disbursementReceipt.save(disbursementReceipt);

      const endpoint = `/institutions/assessment/student/${sharedStudent.id}/application/${application.id}/assessment/${assessment.id}/award`;
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body).toEqual({
            applicationNumber: application.applicationNumber,
            applicationStatus: ApplicationStatus.Completed,
            institutionName:
              assessment.offering.educationProgram.institution.operatingName,
            offeringIntensity: assessment.offering.offeringIntensity,
            offeringStudyStartDate: getDateOnlyFormat(
              assessment.offering.studyStartDate,
            ),
            offeringStudyEndDate: getDateOnlyFormat(
              assessment.offering.studyEndDate,
            ),
            firstDisbursement: {
              disbursementDate: getDateOnlyFullMonthFormat(
                firstDisbursementSchedule.disbursementDate,
              ),
              status: firstDisbursementSchedule.disbursementScheduleStatus,
              coeStatus: firstDisbursementSchedule.coeStatus,
              msfaaNumber: MASKED_MSFAA_NUMBER,
              msfaaId: sharedMSFAANumber.id,
              msfaaCancelledDate: null,
              msfaaDateSigned: sharedMSFAANumber.dateSigned,
              tuitionRemittance: 0,
              enrolmentDate: enrolmentDate1.toISOString(),
              id: firstDisbursementSchedule.id,
              statusUpdatedOn: statusUpdatedOn.toISOString(),
              documentNumber: firstDisbursementSchedule.documentNumber,
              disbursementValues: expect.arrayContaining([
                {
                  valueCode: "CSLP",
                  valueType: DisbursementValueType.CanadaLoan,
                  valueAmount: 100,
                  effectiveAmount: 100,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGP",
                  valueType: DisbursementValueType.CanadaGrant,
                  valueAmount: 200,
                  effectiveAmount: 195,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: true,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSPT",
                  valueType: DisbursementValueType.CanadaGrant,
                  valueAmount: 300,
                  effectiveAmount: 300,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGD",
                  valueType: DisbursementValueType.CanadaGrant,
                  valueAmount: 400,
                  effectiveAmount: 405,
                  hasRestrictionAdjustment: true,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: true,
                },
                {
                  valueCode: "BCAG",
                  valueType: DisbursementValueType.BCGrant,
                  valueAmount: 500,
                  effectiveAmount: 500,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "SBSD",
                  valueType: DisbursementValueType.BCGrant,
                  valueAmount: 600,
                  effectiveAmount: 600,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
              ]),
              receiptReceived: true,
            },
          });
        });
    },
  );

  it("Should throw not found exception when assessment is not found.", async () => {
    // Arrange

    const application = await saveFakeApplicationDisbursements(db.dataSource, {
      institution: collegeF,
      institutionLocation: collegeFLocation,
      student: sharedStudent,
      msfaaNumber: sharedMSFAANumber,
    });

    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/assessment/student/${sharedStudent.id}/application/${application.id}/assessment/9999999/award`;

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

    // College F is a BC Public institution.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/assessment/student/${sharedStudent.id}/application/9999999/assessment/9999999/award`;

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
