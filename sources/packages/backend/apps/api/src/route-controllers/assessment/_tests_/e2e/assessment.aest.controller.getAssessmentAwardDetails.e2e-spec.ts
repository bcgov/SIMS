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
} from "@sims/test-utils";
import {
  ApplicationStatus,
  COEStatus,
  DisbursementScheduleStatus,
  DisbursementValueType,
  MSFAANumber,
  OfferingIntensity,
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

  it("Should get the student assessment award summary containing all federal and provincial estimated and final awards for a full-time application with two disbursements when the receipts are available.", async () => {
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
        // Final amount has been reduced by a $10 overaward amount and $5 restriction amount.
        {
          effectiveAmount: 25,
          overawardAmountSubtracted: 10,
          restrictionAmountSubtracted: 5,
        },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGT",
        50,
        { effectiveAmount: 50 },
      ),
      createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 60, {
        effectiveAmount: 60,
      }),
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
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGT",
        500,
        { effectiveAmount: 500 },
      ),
      createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 600, {
        effectiveAmount: 600,
      }),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 700, {
        effectiveAmount: 700,
      }),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BGPD", 800, {
        effectiveAmount: 800,
      }),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 900, {
        effectiveAmount: 900,
      }),
      createFakeDisbursementValue(
        DisbursementValueType.BCTotalGrant,
        "BCSG",
        701 + 801 + 901,
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
      application.currentAssessment.disbursementSchedules.map((disbursement) =>
        saveFakeDisbursementReceiptsFromDisbursementSchedule(db, disbursement),
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
      .expect({
        applicationNumber: application.applicationNumber,
        applicationStatus: ApplicationStatus.Completed,
        institutionName: offering.educationProgram.institution.operatingName,
        offeringIntensity: OfferingIntensity.fullTime,
        offeringStudyStartDate: getDateOnlyFormat(offering.studyStartDate),
        offeringStudyEndDate: getDateOnlyFormat(offering.studyEndDate),
        estimatedAward: {
          // First disbursement schedule dynamic properties.
          disbursement1Date: getDateOnlyFullMonthFormat(
            firstSchedule.disbursementDate,
          ),
          disbursement1Status: firstSchedule.disbursementScheduleStatus,
          disbursement1COEStatus: COEStatus.completed,
          disbursement1MSFAANumber: sharedMSFAANumber.msfaaNumber,
          disbursement1MSFAAId: sharedMSFAANumber.id,
          disbursement1MSFAACancelledDate: null,
          disbursement1MSFAADateSigned: sharedMSFAANumber.dateSigned,
          disbursement1TuitionRemittance: 1099,
          disbursement1EnrolmentDate: enrolmentDate1.toISOString(),
          disbursement1Id: firstSchedule.id,
          disbursement1StatusUpdatedOn: dateSent1.toISOString(),
          disbursement1DateSent: dateSent1.toISOString(),
          disbursement1DocumentNumber: firstSchedule.documentNumber,
          disbursement1cslf: 10,
          disbursement1csgp: 20,
          disbursement1csgd: 30,
          disbursement1csgf: 40,
          disbursement1csgt: 50,
          disbursement1bcsl: 60,
          disbursement1bcag: 70,
          disbursement1bgpd: 80,
          disbursement1sbsd: 90,

          // Second disbursement schedule dynamic properties.
          disbursement2Date: getDateOnlyFullMonthFormat(
            secondSchedule.disbursementDate,
          ),
          disbursement2Status: secondSchedule.disbursementScheduleStatus,
          disbursement2COEStatus: COEStatus.completed,
          disbursement2MSFAANumber: sharedMSFAANumber.msfaaNumber,
          disbursement2MSFAAId: sharedMSFAANumber.id,
          disbursement2MSFAACancelledDate: null,
          disbursement2MSFAADateSigned: sharedMSFAANumber.dateSigned,
          disbursement2TuitionRemittance: 0,
          disbursement2EnrolmentDate: enrolmentDate2.toISOString(),
          disbursement2Id: secondSchedule.id,
          disbursement2StatusUpdatedOn: dateSent2.toISOString(),
          disbursement2DateSent: dateSent2.toISOString(),
          disbursement2DocumentNumber: secondSchedule.documentNumber,
          disbursement2cslf: 100,
          disbursement2csgp: 200,
          disbursement2csgd: 300,
          disbursement2csgf: 400,
          disbursement2csgt: 500,
          disbursement2bcsl: 600,
          disbursement2bcag: 700,
          disbursement2bgpd: 800,
          disbursement2sbsd: 900,
        },
        finalAward: {
          disbursementReceipt1Received: true,
          disbursementReceipt2Received: true,
          // First disbursement schedule receipt dynamic properties.
          disbursementReceipt1HasAwards: true,
          disbursementReceipt1cslf: 10,
          disbursementReceipt1csgp: 15,
          disbursementReceipt1csgpDisbursedAmountSubtracted: 5,
          disbursementReceipt1csgd: 30,
          disbursementReceipt1csgf: 25,
          disbursementReceipt1csgfOverawardAmountSubtracted: 10,
          disbursementReceipt1csgfRestrictionAmountSubtracted: 5,
          disbursementReceipt1csgt: 50,
          disbursementReceipt1bcsl: 60,
          disbursementReceipt1bcag: 70,
          disbursementReceipt1bgpd: 80,
          disbursementReceipt1sbsd: 90,
          // Second disbursement schedule receipt dynamic properties.
          disbursementReceipt2HasAwards: true,
          disbursementReceipt2cslf: 100,
          disbursementReceipt2csgp: 200,
          disbursementReceipt2csgd: 300,
          disbursementReceipt2csgf: 400,
          disbursementReceipt2csgt: 500,
          disbursementReceipt2bcsl: 600,
          disbursementReceipt2bcag: 700,
          disbursementReceipt2bgpd: 800,
          disbursementReceipt2sbsd: 900,
        },
      });
  });

  it("Should get the student assessment award summary containing estimated and final awards for a part-time application with two disbursements when e-Cert was sent.", async () => {
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
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 555, {
        effectiveAmount: 550,
      }),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 666, {
        effectiveAmount: 660,
      }),
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
        // Final amount has been reduced by a $4 disbursed amount and $5 restriction amount.
        {
          effectiveAmount: 9990,
          disbursedAmountSubtracted: 4,
          restrictionAmountSubtracted: 5,
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
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 1313, {
        effectiveAmount: 1310,
      }),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 1414, {
        effectiveAmount: 1410,
      }),
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
      application.currentAssessment.disbursementSchedules.map((disbursement) =>
        saveFakeDisbursementReceiptsFromDisbursementSchedule(db, disbursement),
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
      .expect({
        applicationNumber: application.applicationNumber,
        applicationStatus: ApplicationStatus.Completed,
        institutionName: offering.educationProgram.institution.operatingName,
        offeringIntensity: OfferingIntensity.partTime,
        offeringStudyStartDate: getDateOnlyFormat(offering.studyStartDate),
        offeringStudyEndDate: getDateOnlyFormat(offering.studyEndDate),
        estimatedAward: {
          // First disbursement schedule dynamic properties.
          disbursement1Date: getDateOnlyFullMonthFormat(
            firstSchedule.disbursementDate,
          ),
          disbursement1Status: firstSchedule.disbursementScheduleStatus,
          disbursement1COEStatus: COEStatus.completed,
          disbursement1MSFAANumber: sharedMSFAANumber.msfaaNumber,
          disbursement1MSFAAId: sharedMSFAANumber.id,
          disbursement1MSFAACancelledDate: null,
          disbursement1MSFAADateSigned: sharedMSFAANumber.dateSigned,
          disbursement1TuitionRemittance: 0,
          disbursement1EnrolmentDate: enrolmentDate1.toISOString(),
          disbursement1Id: firstSchedule.id,
          disbursement1StatusUpdatedOn: dateSent1.toISOString(),
          disbursement1DateSent: dateSent1.toISOString(),
          disbursement1DocumentNumber: firstSchedule.documentNumber,
          disbursement1cslp: 111,
          disbursement1csgp: 222,
          disbursement1cspt: 333,
          disbursement1csgd: 444,
          disbursement1bcag: 555,
          disbursement1sbsd: 666,
          // Second disbursement schedule dynamic properties.
          disbursement2Date: getDateOnlyFullMonthFormat(
            secondSchedule.disbursementDate,
          ),
          disbursement2Status: secondSchedule.disbursementScheduleStatus,
          disbursement2COEStatus: COEStatus.completed,
          disbursement2MSFAANumber: sharedMSFAANumber.msfaaNumber,
          disbursement2MSFAAId: sharedMSFAANumber.id,
          disbursement2MSFAACancelledDate: null,
          disbursement2MSFAADateSigned: sharedMSFAANumber.dateSigned,
          disbursement2TuitionRemittance: 9876,
          disbursement2EnrolmentDate: enrolmentDate2.toISOString(),
          disbursement2Id: secondSchedule.id,
          disbursement2StatusUpdatedOn: dateSent2.toISOString(),
          disbursement2DateSent: dateSent2.toISOString(),
          disbursement2DocumentNumber: secondSchedule.documentNumber,
          disbursement2cslp: 9999,
          disbursement2csgp: 1010,
          disbursement2cspt: 1111,
          disbursement2csgd: 1212,
          disbursement2bcag: 1313,
          disbursement2sbsd: 1414,
        },
        finalAward: {
          disbursementReceipt1Received: true,
          disbursementReceipt2Received: true,
          // First disbursement schedule receipt dynamic properties.
          disbursementReceipt1HasAwards: true,
          disbursementReceipt1cslp: 110,
          disbursementReceipt1csgp: 220,
          disbursementReceipt1cspt: 330,
          disbursementReceipt1csgd: 440,
          disbursementReceipt1bcag: 550,
          disbursementReceipt1sbsd: 660,
          // Second disbursement schedule receipt dynamic properties.
          disbursementReceipt2HasAwards: true,
          disbursementReceipt2cslp: 9990,
          disbursementReceipt2cslpDisbursedAmountSubtracted: 4,
          disbursementReceipt2cslpRestrictionAmountSubtracted: 5,
          disbursementReceipt2csgp: 1010,
          disbursementReceipt2cspt: 1110,
          disbursementReceipt2csgd: 1220,
          disbursementReceipt2csgdOverawardAmountSubtracted: -8,
          disbursementReceipt2bcag: 1310,
          disbursementReceipt2sbsd: 1410,
        },
      });
  });

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
