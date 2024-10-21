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
  DATE_ONLY_FULL_MONTH_FORMAT,
  formatDate,
  getDateOnlyFormat,
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
    // First disbursement values.
    const firstDisbursementValues = [
      createFakeDisbursementValue(DisbursementValueType.CanadaLoan, "CSLF", 1),
      createFakeDisbursementValue(DisbursementValueType.CanadaGrant, "CSGP", 2),
      createFakeDisbursementValue(DisbursementValueType.CanadaGrant, "CSGD", 3),
      createFakeDisbursementValue(DisbursementValueType.CanadaGrant, "CSGF", 4),
      createFakeDisbursementValue(DisbursementValueType.CanadaGrant, "CSGT", 5),
      createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 6),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 7),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BGPD", 8),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 9),
      createFakeDisbursementValue(
        DisbursementValueType.BCTotalGrant,
        "BCSG",
        7 + 8 + 9,
      ),
    ];
    // Second disbursement values.
    const secondDisbursementValues = [
      createFakeDisbursementValue(
        DisbursementValueType.CanadaLoan,
        "CSLF",
        100,
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGP",
        200,
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGD",
        300,
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGF",
        400,
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGT",
        500,
      ),
      createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 600),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 700),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BGPD", 800),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 900),
      createFakeDisbursementValue(
        DisbursementValueType.BCTotalGrant,
        "BCSG",
        700 + 800 + 900,
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
        },
        secondDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          coeStatus: COEStatus.completed,
          dateSent: dateSent2,
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
          disbursement1Date: formatDate(
            firstSchedule.disbursementDate,
            DATE_ONLY_FULL_MONTH_FORMAT,
          ),
          disbursement1Status: firstSchedule.disbursementScheduleStatus,
          disbursement1COEStatus: COEStatus.completed,
          disbursement1MSFAANumber: sharedMSFAANumber.msfaaNumber,
          disbursement1MSFAAId: sharedMSFAANumber.id,
          disbursement1MSFAACancelledDate: null,
          disbursement1MSFAADateSigned: sharedMSFAANumber.dateSigned,
          disbursement1TuitionRemittance: 1099,
          disbursement1DateSent: dateSent1.toISOString(),
          disbursement1DocumentNumber: firstSchedule.documentNumber,
          disbursement1Id: firstSchedule.id,
          disbursement1cslf: 1,
          disbursement1csgp: 2,
          disbursement1csgd: 3,
          disbursement1csgf: 4,
          disbursement1csgt: 5,
          disbursement1bcsl: 6,
          disbursement1bcag: 7,
          disbursement1bgpd: 8,
          disbursement1sbsd: 9,
          // Second disbursement schedule dynamic properties.
          disbursement2Date: formatDate(
            secondSchedule.disbursementDate,
            DATE_ONLY_FULL_MONTH_FORMAT,
          ),
          disbursement2Status: secondSchedule.disbursementScheduleStatus,
          disbursement2COEStatus: COEStatus.completed,
          disbursement2MSFAANumber: sharedMSFAANumber.msfaaNumber,
          disbursement2MSFAAId: sharedMSFAANumber.id,
          disbursement2MSFAACancelledDate: null,
          disbursement2MSFAADateSigned: sharedMSFAANumber.dateSigned,
          disbursement2TuitionRemittance: 0,
          disbursement2DateSent: dateSent2.toISOString(),
          disbursement2DocumentNumber: secondSchedule.documentNumber,
          disbursement2Id: secondSchedule.id,
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
          // First disbursement schedule receipt dynamic properties.
          disbursementReceipt1cslf: 1,
          disbursementReceipt1csgp: 2,
          disbursementReceipt1csgd: 3,
          disbursementReceipt1csgf: 4,
          disbursementReceipt1csgt: 5,
          disbursementReceipt1bcsl: 6,
          disbursementReceipt1bcag: 7,
          disbursementReceipt1bgpd: 8,
          disbursementReceipt1sbsd: 9,
          // Second disbursement schedule receipt dynamic properties.
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
        { effectiveAmount: 9990 },
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
        { effectiveAmount: 1210 },
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
        },
        secondDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          coeStatus: COEStatus.completed,
          tuitionRemittanceRequestedAmount: 9876,
          dateSent: dateSent2,
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
          disbursement1Date: formatDate(
            firstSchedule.disbursementDate,
            DATE_ONLY_FULL_MONTH_FORMAT,
          ),
          disbursement1Status: firstSchedule.disbursementScheduleStatus,
          disbursement1COEStatus: COEStatus.completed,
          disbursement1MSFAANumber: sharedMSFAANumber.msfaaNumber,
          disbursement1MSFAAId: sharedMSFAANumber.id,
          disbursement1MSFAACancelledDate: null,
          disbursement1MSFAADateSigned: sharedMSFAANumber.dateSigned,
          disbursement1TuitionRemittance: 0,
          disbursement1DateSent: dateSent1.toISOString(),
          disbursement1DocumentNumber: firstSchedule.documentNumber,
          disbursement1Id: firstSchedule.id,
          disbursement1cslp: 111,
          disbursement1csgp: 222,
          disbursement1cspt: 333,
          disbursement1csgd: 444,
          disbursement1bcag: 555,
          disbursement1sbsd: 666,
          // Second disbursement schedule dynamic properties.
          disbursement2Date: formatDate(
            secondSchedule.disbursementDate,
            DATE_ONLY_FULL_MONTH_FORMAT,
          ),
          disbursement2Status: secondSchedule.disbursementScheduleStatus,
          disbursement2COEStatus: COEStatus.completed,
          disbursement2MSFAANumber: sharedMSFAANumber.msfaaNumber,
          disbursement2MSFAAId: sharedMSFAANumber.id,
          disbursement2MSFAACancelledDate: null,
          disbursement2MSFAADateSigned: sharedMSFAANumber.dateSigned,
          disbursement2TuitionRemittance: 9876,
          disbursement2DateSent: dateSent2.toISOString(),
          disbursement2DocumentNumber: secondSchedule.documentNumber,
          disbursement2Id: secondSchedule.id,
          disbursement2cslp: 9999,
          disbursement2csgp: 1010,
          disbursement2cspt: 1111,
          disbursement2csgd: 1212,
          disbursement2bcag: 1313,
          disbursement2sbsd: 1414,
        },
        finalAward: {
          // First disbursement schedule receipt dynamic properties.
          disbursementReceipt1cslp: 110,
          disbursementReceipt1csgp: 220,
          disbursementReceipt1cspt: 330,
          disbursementReceipt1csgd: 440,
          disbursementReceipt1bcag: 550,
          disbursementReceipt1sbsd: 660,
          // Second disbursement schedule receipt dynamic properties.
          disbursementReceipt2cslp: 9990,
          disbursementReceipt2csgp: 1010,
          disbursementReceipt2cspt: 1110,
          disbursementReceipt2csgd: 1210,
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
