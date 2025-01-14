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
  createFakeStudentAssessment,
  createFakeDisbursementSchedule,
  createFakeDisbursementValue,
  createFakeMSFAANumber,
  MSFAAStates,
} from "@sims/test-utils";
import {
  AssessmentTriggerType,
  DisbursementValueType,
  OfferingIntensity,
} from "@sims/sims-db";
import { TestingModule } from "@nestjs/testing";
import { getUserFullName } from "../../../../utilities";
import { getDateOnlyFullMonthFormat } from "@sims/utilities";

describe("AssessmentStudentsController(e2e)-getAssessmentNOA", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  it("Should get the student NOA details for an eligible application when the student tries to access it.", async () => {
    // Arrange

    // Create the new student to be mocked as the authenticated one.
    const student = await saveFakeStudent(db.dataSource);
    // Mock user services to return the saved student.
    await mockUserLoginInfo(appModule, student);
    // MSFAA required for the NOA be returned.
    const msfaaNumber = createFakeMSFAANumber(
      { student },
      {
        msfaaState: MSFAAStates.Signed,
      },
    );
    await db.msfaaNumber.save(msfaaNumber);
    // Creates the applications to get the NOA.
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        msfaaNumber,
        student,
      },
      {
        offeringIntensity: OfferingIntensity.partTime,
      },
    );
    // Creates a new application's current assessment.
    const newCurrentAssessment = await db.studentAssessment.save(
      createFakeStudentAssessment(
        {
          auditUser: student.user,
          application,
          offering: application.currentAssessment.offering,
        },
        {
          initialValue: {
            triggerType: AssessmentTriggerType.RelatedApplicationChanged,
          },
        },
      ),
    );
    application.currentAssessment = newCurrentAssessment;
    await db.application.save(application);
    // Create and save a new disbursement schedule for the new assessment.
    const newAssessmentDisbursement = createFakeDisbursementSchedule({
      studentAssessment: newCurrentAssessment,
      msfaaNumber,
      disbursementValues: [
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLF",
          1250,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          1500,
        ),
      ],
    });
    await db.disbursementSchedule.save(newAssessmentDisbursement);

    const assessment = application.currentAssessment;

    const endpoint = `/students/assessment/${newCurrentAssessment.id}/noa`;
    const studentUserToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    const expectation = {
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      applicationStatus: application.applicationStatus,
      assessment: assessment.assessmentData,
      noaApprovalStatus: assessment.noaApprovalStatus,
      applicationCurrentAssessmentId: application.currentAssessment.id,
      fullName: getUserFullName(application.student.user),
      programName: assessment.offering.educationProgram.name,
      locationName: assessment.offering.institutionLocation.name,
      offeringIntensity: OfferingIntensity.partTime,
      offeringStudyEndDate: getDateOnlyFullMonthFormat(
        assessment.offering.studyEndDate,
      ),
      offeringStudyStartDate: getDateOnlyFullMonthFormat(
        assessment.offering.studyStartDate,
      ),
      eligibleAmount: 2750,
      disbursement: {
        disbursement1COEStatus: newAssessmentDisbursement.coeStatus,
        disbursement1Date: getDateOnlyFullMonthFormat(
          newAssessmentDisbursement.disbursementDate,
        ),
        disbursement1Id: newAssessmentDisbursement.id,
        disbursement1MSFAACancelledDate:
          newAssessmentDisbursement.msfaaNumber?.cancelledDate,
        disbursement1MSFAADateSigned:
          newAssessmentDisbursement.msfaaNumber?.dateSigned,
        disbursement1MSFAAId: newAssessmentDisbursement.msfaaNumber?.id,
        disbursement1MSFAANumber: msfaaNumber.msfaaNumber,
        disbursement1Status:
          newAssessmentDisbursement.disbursementScheduleStatus,
        disbursement1TuitionRemittance:
          newAssessmentDisbursement.tuitionRemittanceRequestedAmount,
        disbursement1cslf: 1250,
        disbursement1csgp: 1500,
      },
      offeringName: assessment.offering.name,
    };
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(expectation);
  });

  it.only("Should exclude BC Total Grant from eligible amount calculation when getting NOA details", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    await mockUserLoginInfo(appModule, student);

    // Create signed MSFAA
    const msfaaNumber = createFakeMSFAANumber(
      { student },
      {
        msfaaState: MSFAAStates.Signed,
      },
    );
    await db.msfaaNumber.save(msfaaNumber);

    // Create application with disbursements
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        msfaaNumber,
        student,
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );

    // Create assessment with disbursement schedule containing both regular grants and BC Total Grant
    const assessment = await db.studentAssessment.save(
      createFakeStudentAssessment(
        {
          auditUser: student.user,
          application,
          offering: application.currentAssessment.offering,
        },
        {
          initialValue: {
            triggerType: AssessmentTriggerType.RelatedApplicationChanged,
          },
        },
      ),
    );

    // Set as current assessment
    application.currentAssessment = assessment;
    await db.application.save(application);

    // Create disbursement schedule with mixed grant types
    const disbursementSchedule = createFakeDisbursementSchedule({
      studentAssessment: assessment,
      msfaaNumber,
      disbursementValues: [
        // BC Total Grant (excluded from eligible amount)
        createFakeDisbursementValue(
          DisbursementValueType.BCTotalGrant,
          "BCSG",
          540,
        ),
        // Canada Student Loans and Grants
        createFakeDisbursementValue(
          DisbursementValueType.CanadaLoan,
          "CSLP",
          0,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSGP",
          0,
        ),
        createFakeDisbursementValue(
          DisbursementValueType.CanadaGrant,
          "CSPT",
          2520,
        ),
        // BC Grants
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "BCAG", 140),
        createFakeDisbursementValue(DisbursementValueType.BCGrant, "SBSD", 400),
      ],
    });
    await db.disbursementSchedule.save(disbursementSchedule);

    const endpoint = `/students/assessment/${assessment.id}/noa`;
    const studentUserToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Verify that eligibleAmount excludes BC Total Grant
    expect(response.body.eligibleAmount).toBe(3060); // Sum of CSPT(2520) + BCAG(140) + SBSD(400), excluding BCSG(540)

    // Verify disbursement values are present but BC Total Grant is excluded from eligible amount
    expect(response.body.disbursement).toMatchObject({
      disbursement1bcsg: 540, // BC Total Grant included in details but excluded from eligible amount
      disbursement1cslp: 0,
      disbursement1csgp: 0,
      disbursement1cspt: 2520,
      disbursement1bcag: 140,
      disbursement1sbsd: 400,
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
