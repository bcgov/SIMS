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
  createFakeDisbursementOveraward,
  createFakeStudentRestriction,
  RestrictionCode,
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
      "for a part-time application with a single disbursement (including subtracted amounts) when the e-Cert was sent.",
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

      const [firstSchedule] =
        application.currentAssessment.disbursementSchedules;

      // Save receipts for the first disbursement.
      await saveFakeDisbursementReceiptsFromDisbursementSchedule(
        db,
        firstSchedule,
      );

      const endpoint = `/students/assessment/${application.currentAssessment.id}/award`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      const offering = application.currentAssessment.offering;

      // Act/Assert
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
          firstDisbursement: {
            disbursementDate: getDateOnlyFullMonthFormat(
              firstSchedule.disbursementDate,
            ),
            status: firstSchedule.disbursementScheduleStatus,
            coeStatus: firstSchedule.coeStatus,
            msfaaNumber: "XXXXXXXXXX",
            msfaaId: sharedMSFAANumber.id,
            msfaaCancelledDate: null,
            msfaaDateSigned: sharedMSFAANumber.dateSigned,
            tuitionRemittance: 0,
            enrolmentDate: enrolmentDate1.toISOString(),
            id: firstSchedule.id,
            statusUpdatedOn: statusUpdatedOn.toISOString(),
            disbursementValues: [
              {
                valueCode: "CSLP",
                valueAmount: 111,
                effectiveAmount: 100,
                hasRestrictionAdjustment: false,
                hasDisbursedAdjustment: true,
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
                hasRestrictionAdjustment: true,
                hasDisbursedAdjustment: false,
                hasPositiveOverawardAdjustment: true,
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
            ],
            receiptReceived: true,
          },
          secondDisbursement: null,
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
          firstDisbursement: {
            disbursementDate: getDateOnlyFullMonthFormat(
              firstSchedule.disbursementDate,
            ),
            status: firstSchedule.disbursementScheduleStatus,
            coeStatus: firstSchedule.coeStatus,
            msfaaNumber: "XXXXXXXXXX",
            msfaaId: sharedMSFAANumber.id,
            msfaaCancelledDate: null,
            msfaaDateSigned: sharedMSFAANumber.dateSigned,
            tuitionRemittance: 0,
            enrolmentDate: enrolmentDate1.toISOString(),
            id: firstSchedule.id,
            statusUpdatedOn: statusUpdatedOn1.toISOString(),
            disbursementValues: [
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
            ],
            receiptReceived: true,
          },
          secondDisbursement: {
            disbursementDate: getDateOnlyFullMonthFormat(
              secondSchedule.disbursementDate,
            ),
            status: secondSchedule.disbursementScheduleStatus,
            coeStatus: secondSchedule.coeStatus,
            msfaaNumber: "XXXXXXXXXX",
            msfaaId: sharedMSFAANumber.id,
            msfaaCancelledDate: null,
            msfaaDateSigned: sharedMSFAANumber.dateSigned,
            tuitionRemittance: 9876,
            enrolmentDate: enrolmentDate2.toISOString(),
            id: secondSchedule.id,
            statusUpdatedOn: statusUpdatedOn2.toISOString(),
            disbursementValues: [
              {
                valueCode: "CSLP",
                valueAmount: 9999,
                effectiveAmount: 9990,
                hasRestrictionAdjustment: false,
                hasDisbursedAdjustment: false,
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
                effectiveAmount: 1210,
                hasRestrictionAdjustment: false,
                hasDisbursedAdjustment: false,
                hasPositiveOverawardAdjustment: false,
                hasNegativeOverawardAdjustment: false,
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
            ],
            receiptReceived: true,
          },
        });
    },
  );

  it("Should generate disbursed and positive overaward adjustments based on estimated award values for a part-time application when the disbursement has not been sent yet.", async () => {
    // Arrange
    const statusUpdatedOn = new Date();
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
        { disbursedAmountSubtracted: 150 },
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

    // Create an CSLP positive overaward of $40.
    const positiveOveraward = createFakeDisbursementOveraward({
      student: sharedStudent,
    });
    positiveOveraward.overawardValue = 40;
    positiveOveraward.disbursementValueCode = "CSLP";
    await db.disbursementOveraward.save(positiveOveraward);

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
        firstDisbursement: {
          disbursementDate: getDateOnlyFullMonthFormat(
            firstSchedule.disbursementDate,
          ),
          status: firstSchedule.disbursementScheduleStatus,
          coeStatus: firstSchedule.coeStatus,
          msfaaNumber: "XXXXXXXXXX",
          msfaaId: sharedMSFAANumber.id,
          msfaaCancelledDate: null,
          msfaaDateSigned: sharedMSFAANumber.dateSigned,
          tuitionRemittance: 0,
          enrolmentDate: enrolmentDate1.toISOString(),
          id: firstSchedule.id,
          statusUpdatedOn: statusUpdatedOn.toISOString(),
          disbursementValues: [
            {
              valueCode: "CSLP",
              valueAmount: 100,
              effectiveAmount: null,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: true,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "CSGP",
              valueAmount: 200,
              effectiveAmount: null,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
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
              hasDisbursedAdjustment: true,
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
          ],
          receiptReceived: false,
        },
        secondDisbursement: null,
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
        1001,
        { effectiveAmount: 1001 },
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
      createFakeDisbursementValue(DisbursementValueType.BCLoan, "BCSL", 1004, {
        effectiveAmount: 1004,
      }),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 1005, {
        effectiveAmount: 1005,
      }),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "BGPD", 1006, {
        effectiveAmount: 1006,
      }),
      createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 1007, {
        effectiveAmount: 1007,
      }),
      createFakeDisbursementValue(
        DisbursementValueType.BCTotalGrant,
        "BCSG",
        1006 + 1007 + 1007,
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

    // Save receipts for both disbursements.
    const saveReceiptsPromises =
      application.currentAssessment.disbursementSchedules.map((disbursement) =>
        saveFakeDisbursementReceiptsFromDisbursementSchedule(db, disbursement),
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
        offeringIntensity: OfferingIntensity.fullTime,
        offeringStudyStartDate: getDateOnlyFormat(offering.studyStartDate),
        offeringStudyEndDate: getDateOnlyFormat(offering.studyEndDate),
        firstDisbursement: {
          disbursementDate: getDateOnlyFullMonthFormat(
            firstSchedule.disbursementDate,
          ),
          status: firstSchedule.disbursementScheduleStatus,
          coeStatus: firstSchedule.coeStatus,
          msfaaNumber: "XXXXXXXXXX",
          msfaaId: sharedMSFAANumber.id,
          msfaaCancelledDate: null,
          msfaaDateSigned: sharedMSFAANumber.dateSigned,
          tuitionRemittance: 1099,
          enrolmentDate: enrolmentDate1.toISOString(),
          id: firstSchedule.id,
          statusUpdatedOn: statusUpdatedOn1.toISOString(),
          disbursementValues: [
            {
              valueCode: "CSLF",
              valueAmount: 1000,
              effectiveAmount: 1000,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "CSGP",
              valueAmount: 1001,
              effectiveAmount: 1001,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "CSGD",
              valueAmount: 1002,
              effectiveAmount: 1002,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "CSGF",
              valueAmount: 1003,
              effectiveAmount: 1003,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "BCSL",
              valueAmount: 1004,
              effectiveAmount: 1004,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "BCAG",
              valueAmount: 1005,
              effectiveAmount: 1005,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "BGPD",
              valueAmount: 1006,
              effectiveAmount: 1006,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "SBSD",
              valueAmount: 1007,
              effectiveAmount: 1007,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
          ],
          receiptReceived: true,
        },
        secondDisbursement: {
          disbursementDate: getDateOnlyFullMonthFormat(
            secondSchedule.disbursementDate,
          ),
          status: secondSchedule.disbursementScheduleStatus,
          coeStatus: secondSchedule.coeStatus,
          msfaaNumber: "XXXXXXXXXX",
          msfaaId: sharedMSFAANumber.id,
          msfaaCancelledDate: null,
          msfaaDateSigned: sharedMSFAANumber.dateSigned,
          tuitionRemittance: 0,
          enrolmentDate: enrolmentDate2.toISOString(),
          id: secondSchedule.id,
          statusUpdatedOn: statusUpdatedOn2.toISOString(),
          disbursementValues: [
            {
              valueCode: "CSLF",
              valueAmount: 10010,
              effectiveAmount: 10010,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "CSGP",
              valueAmount: 10011,
              effectiveAmount: 10011,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "CSGD",
              valueAmount: 10012,
              effectiveAmount: 10112,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: true,
            },
            {
              valueCode: "CSGF",
              valueAmount: 10013,
              effectiveAmount: 10013,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "BCSL",
              valueAmount: 10015,
              effectiveAmount: 10015,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "BCAG",
              valueAmount: 10016,
              effectiveAmount: 10016,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "BGPD",
              valueAmount: 10017,
              effectiveAmount: 10017,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "SBSD",
              valueAmount: 10018,
              effectiveAmount: 10018,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
          ],
          receiptReceived: true,
        },
      });
  });

  it("Should generate restriction and positive overaward adjustments based on estimated award values for a full-time application when the disbursement has not been sent yet.", async () => {
    // Arrange
    const statusUpdatedOn = new Date();
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
        { disbursedAmountSubtracted: 150 },
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

    // Create an CSLP positive overaward of $50.
    const positiveOveraward = createFakeDisbursementOveraward({
      student: sharedStudent,
    });
    positiveOveraward.overawardValue = 50;
    positiveOveraward.disbursementValueCode = "CSLP";
    await db.disbursementOveraward.save(positiveOveraward);

    const endpoint = `/students/assessment/${application.currentAssessment.id}/award`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Create a student restriction impacting BCSL
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
        firstDisbursement: {
          disbursementDate: getDateOnlyFullMonthFormat(
            firstSchedule.disbursementDate,
          ),
          status: firstSchedule.disbursementScheduleStatus,
          coeStatus: firstSchedule.coeStatus,
          msfaaNumber: "XXXXXXXXXX",
          msfaaId: sharedMSFAANumber.id,
          msfaaCancelledDate: null,
          msfaaDateSigned: sharedMSFAANumber.dateSigned,
          tuitionRemittance: 0,
          enrolmentDate: enrolmentDate1.toISOString(),
          id: firstSchedule.id,
          statusUpdatedOn: statusUpdatedOn.toISOString(),
          disbursementValues: [
            {
              valueCode: "CSLP",
              valueAmount: 100,
              effectiveAmount: null,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: true,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "CSGP",
              valueAmount: 200,
              effectiveAmount: null,
              hasRestrictionAdjustment: false,
              hasDisbursedAdjustment: false,
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
              hasDisbursedAdjustment: true,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "BCAG",
              valueAmount: 500,
              effectiveAmount: null,
              hasRestrictionAdjustment: true,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
            {
              valueCode: "SBSD",
              valueAmount: 600,
              effectiveAmount: null,
              hasRestrictionAdjustment: true,
              hasDisbursedAdjustment: false,
              hasPositiveOverawardAdjustment: false,
              hasNegativeOverawardAdjustment: false,
            },
          ],
          receiptReceived: false,
        },
        secondDisbursement: null,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
