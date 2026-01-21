import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import {
  saveFakeApplicationDisbursements,
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
  createFakeDisbursementValue,
  MSFAAStates,
  createFakeMSFAANumber,
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

describe("AssessmentStudentsController(e2e)-getAssessmentAwardDetails", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedStudent: Student;
  let sharedMSFAANumber: MSFAANumber;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    // Shared student to be used for tests that would not need further student customization.
    sharedStudent = await saveFakeStudent(db.dataSource);
    await mockUserLoginInfo(module, sharedStudent);
    // Valid MSFAA Number that will be part of the expected returned values.
    sharedMSFAANumber = await db.msfaaNumber.save(
      createFakeMSFAANumber(
        { student: sharedStudent },
        { msfaaState: MSFAAStates.Signed },
      ),
    );
  });

  it(
    "Should get the student assessment summary containing loan and all grants values from e-Cert effective amount " +
      " for a part-time application with a single disbursement (including subtracted amounts) when the e-Cert was sent.",
    async () => {
      // Arrange
      const enrolmentDate1 = addDays(1);
      const statusUpdatedOn = new Date();
      // First disbursement values.
      const firstDisbursementValues = [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLP",
          111,
          // Final amount has been reduced by a $11 disbursed amount.
          { effectiveAmount: 100, disbursedAmountSubtracted: 11 },
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
          // Final amount has been reduced by a $3 overaward amount and a $1 restriction amount.
          {
            effectiveAmount: 440,
            overawardAmountSubtracted: 3,
            restrictionAmountSubtracted: 1,
          },
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
          555 + 666,
          { effectiveAmount: 550 + 660 },
        ),
      ];
      // Part-time application with federal and provincial loans and grants.
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
          firstDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            // Adding date sent to ensure that will not be returned by the API (students should not receive it).
            dateSent: new Date(),
            coeUpdatedAt: enrolmentDate1,
            disbursementScheduleStatusUpdatedOn: statusUpdatedOn,
          },
          secondDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            // Adding date sent to ensure that will not be returned by the API (students should not receive it).
            dateSent: new Date(),
          },
        },
      );

      const endpoint = `/students/assessment/${application.currentAssessment.id}/award`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

      // Act/Assert
      const [firstSchedule] =
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
            disbursement1Date: getDateOnlyFullMonthFormat(
              firstSchedule.disbursementDate,
            ),
            disbursement1Status: firstSchedule.disbursementScheduleStatus,
            disbursement1COEStatus: COEStatus.completed,
            disbursement1MSFAANumber: "XXXXXXXXXX",
            disbursement1MSFAAId: sharedMSFAANumber.id,
            disbursement1MSFAACancelledDate: null,
            disbursement1MSFAADateSigned: sharedMSFAANumber.dateSigned,
            disbursement1EnrolmentDate: enrolmentDate1.toISOString(),
            disbursement1TuitionRemittance: 0,
            disbursement1Id: firstSchedule.id,
            disbursement1StatusUpdatedOn: statusUpdatedOn.toISOString(),
            disbursement1cslp: 111,
            disbursement1csgp: 222,
            disbursement1cspt: 333,
            disbursement1csgd: 444,
            disbursement1bcag: 555,
            disbursement1sbsd: 666,
          },
          finalAward: {
            disbursementReceipt1Received: false,
            disbursementReceipt1HasAwards: true,
            disbursementReceipt1cslp: 100,
            disbursementReceipt1cslpDisbursedAmountSubtracted: 11,
            disbursementReceipt1csgp: 220,
            disbursementReceipt1cspt: 330,
            disbursementReceipt1csgd: 440,
            disbursementReceipt1csgdOverawardAmountSubtracted: 3,
            disbursementReceipt1csgdRestrictionAmountSubtracted: 1,
            disbursementReceipt1bcag: 550,
            disbursementReceipt1sbsd: 660,
          },
        });
    },
  );

  it(
    "Should get the student assessment summary containing loan and all grants values from e-Cert effective amount " +
      "for a part-time application with two disbursements when the e-Cert was sent.",
    async () => {
      // Arrange
      const [enrolmentDate1, enrolmentDate2] = [addDays(1), addDays(30)];
      const [statusUpdatedOn1, statusUpdatedOn2] = [addDays(2), addDays(31)];
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
          1313 + 1414,
          { effectiveAmount: 1310 + 1410 },
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
            coeUpdatedAt: enrolmentDate1,
            disbursementScheduleStatusUpdatedOn: statusUpdatedOn1,
          },
          secondDisbursementInitialValues: {
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            coeStatus: COEStatus.completed,
            tuitionRemittanceRequestedAmount: 9876,
            coeUpdatedAt: enrolmentDate2,
            disbursementScheduleStatusUpdatedOn: statusUpdatedOn2,
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

      const endpoint = `/students/assessment/${application.currentAssessment.id}/award`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );

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
            disbursement1MSFAANumber: "XXXXXXXXXX",
            disbursement1MSFAAId: sharedMSFAANumber.id,
            disbursement1MSFAACancelledDate: null,
            disbursement1MSFAADateSigned: sharedMSFAANumber.dateSigned,
            disbursement1TuitionRemittance: 0,
            disbursement1Id: firstSchedule.id,
            disbursement1StatusUpdatedOn: statusUpdatedOn1.toISOString(),
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
            disbursement1EnrolmentDate: enrolmentDate1.toISOString(),
            disbursement2Status: secondSchedule.disbursementScheduleStatus,
            disbursement2COEStatus: COEStatus.completed,
            disbursement2MSFAANumber: "XXXXXXXXXX",
            disbursement2MSFAAId: sharedMSFAANumber.id,
            disbursement2MSFAACancelledDate: null,
            disbursement2MSFAADateSigned: sharedMSFAANumber.dateSigned,
            disbursement2TuitionRemittance: 9876,
            disbursement2Id: secondSchedule.id,
            disbursement2StatusUpdatedOn: statusUpdatedOn2.toISOString(),
            disbursement2cslp: 9999,
            disbursement2csgp: 1010,
            disbursement2cspt: 1111,
            disbursement2csgd: 1212,
            disbursement2bcag: 1313,
            disbursement2sbsd: 1414,
            disbursement2EnrolmentDate: enrolmentDate2.toISOString(),
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
            disbursementReceipt2csgp: 1010,
            disbursementReceipt2cspt: 1110,
            disbursementReceipt2csgd: 1210,
            disbursementReceipt2bcag: 1310,
            disbursementReceipt2sbsd: 1410,
          },
        });
    },
  );

  it("Should not generate final award values for a part-time application when the disbursement has not been sent yet.", async () => {
    // Arrange
    const statusUpdatedOn = new Date();
    const enrolmentDate1 = addDays(1);
    const firstDisbursementValues = [
      createFakeDisbursementValue(
        DisbursementValueType.CanadaLoan,
        "CSLP",
        111,
        { effectiveAmount: 110 },
      ),
    ];
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
        firstDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
          coeUpdatedAt: enrolmentDate1,
          disbursementScheduleStatusUpdatedOn: statusUpdatedOn,
        },
      },
    );

    const endpoint = `/students/assessment/${application.currentAssessment.id}/award`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    const [firstSchedule] = application.currentAssessment.disbursementSchedules;
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
          disbursement1Date: getDateOnlyFullMonthFormat(
            firstSchedule.disbursementDate,
          ),
          disbursement1Status: firstSchedule.disbursementScheduleStatus,
          disbursement1COEStatus: COEStatus.completed,
          disbursement1MSFAANumber: "XXXXXXXXXX",
          disbursement1MSFAAId: sharedMSFAANumber.id,
          disbursement1MSFAACancelledDate: null,
          disbursement1MSFAADateSigned: sharedMSFAANumber.dateSigned,
          disbursement1TuitionRemittance: 0,
          disbursement1Id: firstSchedule.id,
          disbursement1StatusUpdatedOn: statusUpdatedOn.toISOString(),
          disbursement1cslp: 111,
          disbursement1EnrolmentDate: enrolmentDate1.toISOString(),
        },
      });
  });

  it("Should get the student assessment summary containing federal and provincial loans and all grants for a full-time application with two disbursements that includes subtracted amounts on the second disbursement.", async () => {
    const [enrolmentDate1, enrolmentDate2] = [addDays(1), addDays(30)];
    const [statusUpdatedOn1, statusUpdatedOn2] = [addDays(2), addDays(31)];
    // First disbursement values.
    const firstDisbursementValues = [
      createFakeDisbursementValue(
        DisbursementValueType.CanadaLoan,
        "CSLF",
        1000,
        { effectiveAmount: 1000 },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGP",
        10001,
        { effectiveAmount: 10001 },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGD",
        1002,
        { effectiveAmount: 1002 },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGF",
        1003,
        { effectiveAmount: 1003 },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGT",
        1004,
        { effectiveAmount: 1004 },
      ),
      createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 1005, {
        effectiveAmount: 1005,
      }),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 1006, {
        effectiveAmount: 1006,
      }),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BGPD", 1007, {
        effectiveAmount: 1007,
      }),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 1008, {
        effectiveAmount: 1008,
      }),
      createFakeDisbursementValue(
        DisbursementValueType.BCTotalGrant,
        "BCSG",
        1006 + 1007 + 1008,
        { effectiveAmount: 1006 + 1007 + 1008 },
      ),
    ];
    // Second disbursement values.
    const secondDisbursementValues = [
      createFakeDisbursementValue(
        DisbursementValueType.CanadaLoan,
        "CSLF",
        10010,
        { effectiveAmount: 10010 },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGP",
        10011,
        { effectiveAmount: 10011 },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGD",
        10012,
        // Final amount has been increased by a -$100 overaward amount.
        { effectiveAmount: 10112, overawardAmountSubtracted: -100 },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGF",
        10013,
        { effectiveAmount: 10013 },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.CanadaGrant,
        "CSGT",
        10014,
        { effectiveAmount: 10014 },
      ),
      createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 10015, {
        effectiveAmount: 10015,
      }),
      createFakeDisbursementValue(
        DisbursementValueType.BCGrant,
        "BCAG",
        10016,
        {
          effectiveAmount: 10016,
        },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.BCGrant,
        "BGPD",
        10017,
        {
          effectiveAmount: 10017,
        },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.BCGrant,
        "SBSD",
        10018,
        {
          effectiveAmount: 10018,
        },
      ),
      createFakeDisbursementValue(
        DisbursementValueType.BCTotalGrant,
        "BCSG",
        10016 + 10017 + 10018,
        {
          effectiveAmount: 10016 + 10017 + 10018,
        },
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
          tuitionRemittanceRequestedAmount: 1099,
          // Adding date sent to ensure that will not be returned by the API (students should not receive it).
          dateSent: new Date(),
          coeUpdatedAt: enrolmentDate1,
          disbursementScheduleStatusUpdatedOn: statusUpdatedOn1,
        },
        secondDisbursementInitialValues: {
          disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
          coeStatus: COEStatus.completed,
          coeUpdatedAt: enrolmentDate2,
          disbursementScheduleStatusUpdatedOn: statusUpdatedOn2,
        },
      },
    );

    const endpoint = `/students/assessment/${application.currentAssessment.id}/award`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

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
          disbursement1MSFAANumber: "XXXXXXXXXX",
          disbursement1MSFAAId: sharedMSFAANumber.id,
          disbursement1MSFAACancelledDate: null,
          disbursement1MSFAADateSigned: sharedMSFAANumber.dateSigned,
          disbursement1TuitionRemittance: 1099,
          disbursement1Id: firstSchedule.id,
          disbursement1StatusUpdatedOn: statusUpdatedOn1.toISOString(),
          disbursement1cslf: 1000,
          disbursement1csgp: 10001,
          disbursement1csgd: 1002,
          disbursement1csgf: 1003,
          disbursement1csgt: 1004,
          disbursement1bcsl: 1005,
          disbursement1bcag: 1006,
          disbursement1bgpd: 1007,
          disbursement1sbsd: 1008,
          disbursement1EnrolmentDate: enrolmentDate1.toISOString(),
          // Second disbursement schedule dynamic properties.
          disbursement2Date: getDateOnlyFullMonthFormat(
            secondSchedule.disbursementDate,
          ),
          disbursement2Status: secondSchedule.disbursementScheduleStatus,
          disbursement2COEStatus: COEStatus.completed,
          disbursement2MSFAANumber: "XXXXXXXXXX",
          disbursement2MSFAAId: sharedMSFAANumber.id,
          disbursement2MSFAACancelledDate: null,
          disbursement2MSFAADateSigned: sharedMSFAANumber.dateSigned,
          disbursement2TuitionRemittance: 0,
          disbursement2Id: secondSchedule.id,
          disbursement2StatusUpdatedOn: statusUpdatedOn2.toISOString(),
          disbursement2cslf: 10010,
          disbursement2csgp: 10011,
          disbursement2csgd: 10012,
          disbursement2csgf: 10013,
          disbursement2csgt: 10014,
          disbursement2bcsl: 10015,
          disbursement2bcag: 10016,
          disbursement2bgpd: 10017,
          disbursement2sbsd: 10018,
          disbursement2EnrolmentDate: enrolmentDate2.toISOString(),
        },
        finalAward: {
          // Receipt isn't available but final values still should be populated.
          disbursementReceipt1Received: false,
          disbursementReceipt2Received: false,
          // First disbursement schedule receipt dynamic properties.
          disbursementReceipt1HasAwards: true,
          disbursementReceipt1cslf: 1000,
          disbursementReceipt1csgp: 10001,
          disbursementReceipt1csgd: 1002,
          disbursementReceipt1csgf: 1003,
          disbursementReceipt1csgt: 1004,
          disbursementReceipt1bcsl: 1005,
          disbursementReceipt1bcag: 1006,
          disbursementReceipt1bgpd: 1007,
          disbursementReceipt1sbsd: 1008,
          // Second disbursement schedule receipt dynamic properties.
          disbursementReceipt2HasAwards: true,
          disbursementReceipt2cslf: 10010,
          disbursementReceipt2csgp: 10011,
          disbursementReceipt2csgd: 10112,
          disbursementReceipt2csgdOverawardAmountSubtracted: -100,
          disbursementReceipt2csgf: 10013,
          disbursementReceipt2csgt: 10014,
          disbursementReceipt2bcsl: 10015,
          disbursementReceipt2bcag: 10016,
          disbursementReceipt2bgpd: 10017,
          disbursementReceipt2sbsd: 10018,
        },
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
