import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  saveFakeStudent,
  saveFakeApplicationDisbursements,
  createFakeMSFAANumber,
  MSFAAStates,
  E2EDataSources,
  createE2EDataSources,
  createFakeDisbursementValue,
  saveFakeDisbursementReceiptsFromDisbursementSchedule,
  createFakeStudentRestriction,
  RestrictionCode,
  saveFakeApplicationRestrictionBypass,
} from "@sims/test-utils";
import {
  ApplicationStatus,
  COEStatus,
  DisbursementScheduleStatus,
  DisbursementValueType,
  MSFAANumber,
  OfferingIntensity,
  RestrictionActionType,
  Student,
} from "@sims/sims-db";
import {
  addDays,
  getDateOnlyFormat,
  getDateOnlyFullMonthFormat,
} from "@sims/utilities";

describe("AssessmentAESTController(e2e)-getAssessmentAwardDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedStudent: Student;
  let sharedMSFAANumber: MSFAANumber;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
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
    "Should get the student assessment award summary containing all federal and provincial estimated and final awards " +
      "for a full-time application with two disbursements (including adjustments) when the e-Cert was sent.",
    async () => {
      // Arrange
      const [dateSent1, dateSent2] = [addDays(-30), addDays(-1)];
      const [enrolmentDate1, enrolmentDate2] = [addDays(1), addDays(30)];
      // First disbursement values.
      const firstDisbursementValues = [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLF",
          10,
          {
            effectiveAmount: 10,
          },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          20,
          // Final amount has been reduced by a $5 disbursed amount.
          { effectiveAmount: 15, disbursedAmountSubtracted: 5 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGD",
          30,
          { effectiveAmount: 30 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGF",
          40,
          // Final amount has been reduced by a $15 overaward amount.
          {
            effectiveAmount: 25,
            overawardAmountSubtracted: 15,
          },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCLoan,
          "BCSL",
          60,
          // Final amount has been reduced to $0 due to a B2 restriction
          {
            effectiveAmount: 0,
            restrictionAmountSubtracted: 60,
          },
        ),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 70, {
          effectiveAmount: 70,
        }),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "BGPD", 80, {
          effectiveAmount: 80,
        }),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 90, {
          effectiveAmount: 90,
        }),
        createFakeDisbursementValue(
          DisbursementValueType.BCTotalGrant,
          "BCSG",
          70 + 80 + 90,
          { effectiveAmount: 70 + 80 + 90 },
        ),
      ];
      // Second disbursement values.
      const secondDisbursementValues = [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLF",
          100,
          { effectiveAmount: 100 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          200,
          { effectiveAmount: 200 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGD",
          300,
          { effectiveAmount: 300 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGF",
          400,
          { effectiveAmount: 400 },
        ),
        createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 600, {
          effectiveAmount: 600,
        }),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "BCAG",
          700,
          {
            effectiveAmount: 700,
          },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "BGPD",
          800,
          {
            effectiveAmount: 800,
          },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "SBSD",
          900,
          {
            effectiveAmount: 900,
          },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCTotalGrant,
          "BCSG",
          700 + 800 + 900,
          { effectiveAmount: 700 + 800 + 900 },
        ),
      ];
      // Full-time application with federal and provincial loans and grants and two disbursements.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student: sharedStudent,
          msfaaNumber: sharedMSFAANumber,
          firstDisbursementValues,
          secondDisbursementValues,
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
          createSecondDisbursement: true,
          firstDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            dateSent: dateSent1,
            tuitionRemittanceRequestedAmount: 1099,
            coeUpdatedAt: enrolmentDate1,
            disbursementScheduleStatusUpdatedOn: dateSent1,
          },
          secondDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            coeStatus: COEStatus.completed,
            dateSent: dateSent2,
            coeUpdatedAt: enrolmentDate2,
            disbursementScheduleStatusUpdatedOn: dateSent2,
          },
        },
      );
      // Save receipts for both disbursements.
      const saveReceiptsPromises =
        application.currentAssessment.disbursementSchedules.map(
          (disbursement) =>
            saveFakeDisbursementReceiptsFromDisbursementSchedule(
              db,
              disbursement,
            ),
        );
      await Promise.all(saveReceiptsPromises);

      const endpoint = `/aest/assessment/${application.currentAssessment.id}/award`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      const [firstSchedule, secondSchedule] =
        application.currentAssessment.disbursementSchedules;

      const offering = application.currentAssessment.offering;

      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body).toEqual({
            applicationNumber: application.applicationNumber,
            applicationStatus: ApplicationStatus.Completed,
            institutionName:
              offering.educationProgram.institution.operatingName,
            offeringIntensity: OfferingIntensity.fullTime,
            offeringStudyStartDate: getDateOnlyFormat(offering.studyStartDate),
            offeringStudyEndDate: getDateOnlyFormat(offering.studyEndDate),
            firstDisbursement: {
              disbursementDate: getDateOnlyFullMonthFormat(
                firstSchedule.disbursementDate,
              ),
              status: firstSchedule.disbursementScheduleStatus,
              coeStatus: firstSchedule.coeStatus,
              msfaaNumber: sharedMSFAANumber.msfaaNumber,
              msfaaId: sharedMSFAANumber.id,
              msfaaCancelledDate: null,
              msfaaDateSigned: sharedMSFAANumber.dateSigned,
              tuitionRemittance: 1099,
              enrolmentDate: enrolmentDate1.toISOString(),
              id: firstSchedule.id,
              statusUpdatedOn: dateSent1.toISOString(),
              dateSent: dateSent1.toISOString(),
              documentNumber: firstSchedule.documentNumber,
              disbursementValues: expect.arrayContaining([
                {
                  valueCode: "CSLF",
                  valueAmount: 10,
                  effectiveAmount: 10,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGP",
                  valueAmount: 20,
                  effectiveAmount: 15,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: true,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGD",
                  valueAmount: 30,
                  effectiveAmount: 30,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGF",
                  valueAmount: 40,
                  effectiveAmount: 25,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: true,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "BCSL",
                  valueAmount: 60,
                  effectiveAmount: 0,
                  hasRestrictionAdjustment: true,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "BCAG",
                  valueAmount: 70,
                  effectiveAmount: 70,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "BGPD",
                  valueAmount: 80,
                  effectiveAmount: 80,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "SBSD",
                  valueAmount: 90,
                  effectiveAmount: 90,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
              ]),
              receiptReceived: true,
            },
            secondDisbursement: {
              disbursementDate: getDateOnlyFullMonthFormat(
                secondSchedule.disbursementDate,
              ),
              status: secondSchedule.disbursementScheduleStatus,
              coeStatus: secondSchedule.coeStatus,
              msfaaNumber: sharedMSFAANumber.msfaaNumber,
              msfaaId: sharedMSFAANumber.id,
              msfaaCancelledDate: null,
              msfaaDateSigned: sharedMSFAANumber.dateSigned,
              tuitionRemittance: 0,
              enrolmentDate: enrolmentDate2.toISOString(),
              id: secondSchedule.id,
              statusUpdatedOn: dateSent2.toISOString(),
              dateSent: dateSent2.toISOString(),
              documentNumber: secondSchedule.documentNumber,
              disbursementValues: expect.arrayContaining([
                {
                  valueCode: "CSLF",
                  valueAmount: 100,
                  effectiveAmount: 100,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGP",
                  valueAmount: 200,
                  effectiveAmount: 200,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGD",
                  valueAmount: 300,
                  effectiveAmount: 300,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGF",
                  valueAmount: 400,
                  effectiveAmount: 400,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "BCSL",
                  valueAmount: 600,
                  effectiveAmount: 600,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "BCAG",
                  valueAmount: 700,
                  effectiveAmount: 700,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "BGPD",
                  valueAmount: 800,
                  effectiveAmount: 800,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "SBSD",
                  valueAmount: 900,
                  effectiveAmount: 900,
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

  it(
    "Should get the student assessment award summary containing all federal and provincial estimated and final awards " +
      "for a part-time application with two disbursements (including adjustments) when the e-Cert was sent.",
    async () => {
      // Arrange
      const [dateSent1, dateSent2] = [addDays(-60), addDays(-5)];
      const [enrolmentDate1, enrolmentDate2] = [addDays(1), addDays(30)];
      // First disbursement values.
      const firstDisbursementValues = [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLP",
          111,
          { effectiveAmount: 110 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          222,
          { effectiveAmount: 220 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSPT",
          333,
          { effectiveAmount: 330 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGD",
          444,
          { effectiveAmount: 440 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "BCAG",
          555,
          {
            effectiveAmount: 550,
          },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "SBSD",
          666,
          {
            effectiveAmount: 660,
          },
        ),
        // Must be ignored in the result even being present with an effective value.
        createFakeDisbursementValue(
          DisbursementValueType.BCTotalGrant,
          "BCSG",
          123,
          { effectiveAmount: 123 },
        ),
      ];
      // Second disbursement values.
      const secondDisbursementValues = [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLP",
          9999,
          // Final amount has been reduced by a $9 disbursed amount.
          {
            effectiveAmount: 9990,
            disbursedAmountSubtracted: 9,
          },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          1010,
          { effectiveAmount: 1010 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSPT",
          1111,
          { effectiveAmount: 1110 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGD",
          1212,
          // Final amount has been increased by a $-8 overaward amount.
          { effectiveAmount: 1220, overawardAmountSubtracted: -8 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "BCAG",
          1313,
          {
            effectiveAmount: 1310,
          },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.BCGrant,
          "SBSD",
          1414,
          {
            effectiveAmount: 1410,
          },
        ),
        // Must be ignored in the result even being present with an effective value.
        createFakeDisbursementValue(
          DisbursementValueType.BCTotalGrant,
          "BCSG",
          1234,
          { effectiveAmount: 1234 },
        ),
      ];
      // Part-time application with federal and provincial loans and grants and two disbursements.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student: sharedStudent,
          msfaaNumber: sharedMSFAANumber,
          firstDisbursementValues,
          secondDisbursementValues,
        },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          createSecondDisbursement: true,
          firstDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            dateSent: dateSent1,
            coeUpdatedAt: enrolmentDate1,
            disbursementScheduleStatusUpdatedOn: dateSent1,
          },
          secondDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            coeStatus: COEStatus.completed,
            tuitionRemittanceRequestedAmount: 9876,
            dateSent: dateSent2,
            coeUpdatedAt: enrolmentDate2,
            disbursementScheduleStatusUpdatedOn: dateSent2,
          },
        },
      );
      // Save receipts for both disbursements.
      const saveReceiptsPromises =
        application.currentAssessment.disbursementSchedules.map(
          (disbursement) =>
            saveFakeDisbursementReceiptsFromDisbursementSchedule(
              db,
              disbursement,
            ),
        );
      await Promise.all(saveReceiptsPromises);

      const endpoint = `/aest/assessment/${application.currentAssessment.id}/award`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      const [firstSchedule, secondSchedule] =
        application.currentAssessment.disbursementSchedules;
      const offering = application.currentAssessment.offering;

      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body).toEqual({
            applicationNumber: application.applicationNumber,
            applicationStatus: ApplicationStatus.Completed,
            institutionName:
              offering.educationProgram.institution.operatingName,
            offeringIntensity: OfferingIntensity.partTime,
            offeringStudyStartDate: getDateOnlyFormat(offering.studyStartDate),
            offeringStudyEndDate: getDateOnlyFormat(offering.studyEndDate),
            firstDisbursement: {
              disbursementDate: getDateOnlyFullMonthFormat(
                firstSchedule.disbursementDate,
              ),
              status: firstSchedule.disbursementScheduleStatus,
              coeStatus: firstSchedule.coeStatus,
              msfaaNumber: sharedMSFAANumber.msfaaNumber,
              msfaaId: sharedMSFAANumber.id,
              msfaaCancelledDate: null,
              msfaaDateSigned: sharedMSFAANumber.dateSigned,
              tuitionRemittance: 0,
              enrolmentDate: enrolmentDate1.toISOString(),
              id: firstSchedule.id,
              statusUpdatedOn: dateSent1.toISOString(),
              dateSent: dateSent1.toISOString(),
              documentNumber: firstSchedule.documentNumber,
              disbursementValues: expect.arrayContaining([
                {
                  valueCode: "CSLP",
                  valueAmount: 111,
                  effectiveAmount: 110,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGP",
                  valueAmount: 222,
                  effectiveAmount: 220,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSPT",
                  valueAmount: 333,
                  effectiveAmount: 330,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGD",
                  valueAmount: 444,
                  effectiveAmount: 440,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "BCAG",
                  valueAmount: 555,
                  effectiveAmount: 550,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "SBSD",
                  valueAmount: 666,
                  effectiveAmount: 660,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
              ]),
              receiptReceived: true,
            },
            secondDisbursement: {
              disbursementDate: getDateOnlyFullMonthFormat(
                secondSchedule.disbursementDate,
              ),
              status: secondSchedule.disbursementScheduleStatus,
              coeStatus: secondSchedule.coeStatus,
              msfaaNumber: sharedMSFAANumber.msfaaNumber,
              msfaaId: sharedMSFAANumber.id,
              msfaaCancelledDate: null,
              msfaaDateSigned: sharedMSFAANumber.dateSigned,
              tuitionRemittance: 9876,
              enrolmentDate: enrolmentDate2.toISOString(),
              id: secondSchedule.id,
              statusUpdatedOn: dateSent2.toISOString(),
              dateSent: dateSent2.toISOString(),
              documentNumber: secondSchedule.documentNumber,
              disbursementValues: expect.arrayContaining([
                {
                  valueCode: "CSLP",
                  valueAmount: 9999,
                  effectiveAmount: 9990,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: true,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGP",
                  valueAmount: 1010,
                  effectiveAmount: 1010,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSPT",
                  valueAmount: 1111,
                  effectiveAmount: 1110,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGD",
                  valueAmount: 1212,
                  effectiveAmount: 1220,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: true,
                },
                {
                  valueCode: "BCAG",
                  valueAmount: 1313,
                  effectiveAmount: 1310,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "SBSD",
                  valueAmount: 1414,
                  effectiveAmount: 1410,
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

  it(
    "Should get the student assessment award summary containing all federal and provincial estimated and final awards " +
      "for a part-time application with one disbursement (including disbursed adjustment and a bypassed restriction) when the e-Cert was not sent.",
    async () => {
      // Arrange
      const dateSent1 = addDays(-60);
      const enrolmentDate1 = addDays(1);
      // First disbursement values.
      const firstDisbursementValues = [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLP",
          100,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          200,
          { disbursedAmountSubtracted: 50 },
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSPT",
          300,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGD",
          400,
        ),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 500),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 600),
        // Must be ignored in the result even being present with an effective value.
        createFakeDisbursementValue(
          DisbursementValueType.BCTotalGrant,
          "BCSG",
          500 + 600,
        ),
      ];

      // Part-time application with federal and provincial loans and grants and two disbursements.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student: sharedStudent,
          msfaaNumber: sharedMSFAANumber,
          firstDisbursementValues,
        },
        {
          offeringIntensity: OfferingIntensity.partTime,
          applicationStatus: ApplicationStatus.Completed,
          createSecondDisbursement: false,
          firstDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
            dateSent: dateSent1,
            coeUpdatedAt: enrolmentDate1,
            disbursementScheduleStatusUpdatedOn: dateSent1,
          },
        },
      );

      // Create a student restriction impacting BC Load/Grant
      const restriction = await db.restriction.findOne({
        select: { id: true },
        where: {
          restrictionCode: RestrictionCode.B6A,
        },
      });
      await db.restriction.save(restriction);
      const b2Restriction = createFakeStudentRestriction({
        student: sharedStudent,
        restriction: restriction,
      });
      await db.studentRestriction.save(b2Restriction);

      // Bypass the restriction
      await saveFakeApplicationRestrictionBypass(
        db,
        {
          application,
          studentRestriction: b2Restriction,
        },
        {
          restrictionActionType: RestrictionActionType.StopPartTimeBCGrants,
          restrictionCode: RestrictionCode.B6A,
        },
      );

      const endpoint = `/aest/assessment/${application.currentAssessment.id}/award`;
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      const [firstSchedule] =
        application.currentAssessment.disbursementSchedules;
      const offering = application.currentAssessment.offering;

      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body).toEqual({
            applicationNumber: application.applicationNumber,
            applicationStatus: ApplicationStatus.Completed,
            institutionName:
              offering.educationProgram.institution.operatingName,
            offeringIntensity: OfferingIntensity.partTime,
            offeringStudyStartDate: getDateOnlyFormat(offering.studyStartDate),
            offeringStudyEndDate: getDateOnlyFormat(offering.studyEndDate),
            firstDisbursement: {
              disbursementDate: getDateOnlyFullMonthFormat(
                firstSchedule.disbursementDate,
              ),
              status: firstSchedule.disbursementScheduleStatus,
              coeStatus: firstSchedule.coeStatus,
              msfaaNumber: sharedMSFAANumber.msfaaNumber,
              msfaaId: sharedMSFAANumber.id,
              msfaaCancelledDate: null,
              msfaaDateSigned: sharedMSFAANumber.dateSigned,
              tuitionRemittance: 0,
              enrolmentDate: enrolmentDate1.toISOString(),
              id: firstSchedule.id,
              statusUpdatedOn: dateSent1.toISOString(),
              dateSent: dateSent1.toISOString(),
              documentNumber: firstSchedule.documentNumber,
              disbursementValues: expect.arrayContaining([
                {
                  valueCode: "CSLP",
                  valueAmount: 100,
                  effectiveAmount: null,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGP",
                  valueAmount: 200,
                  effectiveAmount: null,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: true,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSPT",
                  valueAmount: 300,
                  effectiveAmount: null,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "CSGD",
                  valueAmount: 400,
                  effectiveAmount: null,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "BCAG",
                  valueAmount: 500,
                  effectiveAmount: null,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
                {
                  valueCode: "SBSD",
                  valueAmount: 600,
                  effectiveAmount: null,
                  hasRestrictionAdjustment: false,
                  hasDisbursedAdjustment: false,
                  hasPositiveOverawardAdjustment: false,
                  hasNegativeOverawardAdjustment: false,
                },
              ]),
              receiptReceived: false,
            },
          });
        });
    },
  );

  it("Should throw not found exception when assessment is not found.", async () => {
    // Arrange
    const endpoint = "/aest/assessment/99999/award";
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Assessment not found.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
