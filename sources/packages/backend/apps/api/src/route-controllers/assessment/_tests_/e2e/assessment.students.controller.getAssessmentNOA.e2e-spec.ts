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
  Assessment,
  AssessmentTriggerType,
  DisbursementValueType,
  OfferingIntensity,
  WorkflowData,
} from "@sims/sims-db";
import { TestingModule } from "@nestjs/testing";
import { getUserFullName } from "../../../../utilities";
import { addDays, getDateOnlyFullMonthFormat } from "@sims/utilities";

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

  it("Should get the student NOA details for an eligible part-time application when the student tries to access it.", async () => {
    // Arrange
    const enrolmentDate1 = addDays(1);
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
          applicationEditStatusUpdatedBy: student.user,
        },
        {
          initialValue: {
            triggerType: AssessmentTriggerType.RelatedApplicationChanged,
            workflowData: {
              calculatedData: {
                totalAdditionalTransportationAllowance: 100,
                returnTransportationCost: 200,
              },
            } as WorkflowData,
          },
        },
      ),
    );
    application.currentAssessment = newCurrentAssessment;
    await db.application.save(application);
    // Create and save a new disbursement schedule for the new assessment.
    const newAssessmentDisbursement = createFakeDisbursementSchedule(
      {
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
      },
      { initialValues: { coeUpdatedAt: enrolmentDate1 } },
    );
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
      assessment: {
        ...assessment.assessmentData,
        totalAdditionalTransportationAllowance: 100,
        returnTransportationCost: 200,
      },
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
        disbursement1EnrolmentDate: enrolmentDate1.toISOString(),
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

  it("Should get the student NOA details for an eligible full-time application when the student tries to access it.", async () => {
    // Arrange
    const enrolmentDate1 = addDays(1);
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
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );
    const assessmentData = {
      weeks: 21,
      tuitionCost: 5555,
      childcareCost: 0,
      finalAwardTotal: 10920,
      livingAllowance: 22386,
      exceptionalCosts: 330,
      targetedResources: 0,
      totalAssessedCost: 37422.4,
      totalFamilyIncome: 444,
      totalFederalAward: 6300,
      transportationCost: 1022.4,
      partnerStudentLoans: 33,
      secondResidenceCost: 7497,
      totalAssessmentNeed: 36513.74615384615,
      booksAndSuppliesCost: 550,
      totalProvincialAward: 4620,
      alimonyOrChildSupport: 44,
      federalAssessmentNeed: 36513.74615384615,
      exceptionalEducationCost: 5,
      provincialAssessmentNeed: 36513.74615384615,
      totalFederalContribution: 908.6538461538462,
      parentalAssetContribution: null,
      parentAssessedContribution: null,
      partnerAssessedContribution: 0,
      partnerExpectedContribution: 0,
      totalProvincialContribution: 908.6538461538462,
      parentalVoluntaryContribution: 0,
      totalFederalAssessedResources: null,
      finalFederalAwardNetCSGDAmount: 0,
      finalFederalAwardNetCSGFAmount: 2544.15,
      finalFederalAwardNetCSGPAmount: 0,
      studentTotalFederalContribution: 908.6538461538462,
      totalProvincialAssessedResources: null,
      finalProvincialAwardNetBCAGAmount: 617.61,
      finalProvincialAwardNetBCSLAmount: 4002.39,
      finalProvincialAwardNetBGPDAmount: 0,
      finalProvincialAwardNetSBSDAmount: 0,
      parentalDiscretionaryContribution: null,
      scholarshipsBursariesContribution: 0,
      studentExpectedFederalContribution: 908.6538461538462,
      studentTotalProvincialContribution: 908.6538461538462,
      studentExpectedProvincialContribution: 908.6538461538462,
    } as Assessment;
    // Creates a new application's current assessment.
    const newCurrentAssessment = await db.studentAssessment.save(
      createFakeStudentAssessment(
        {
          auditUser: student.user,
          application,
          offering: application.currentAssessment.offering,
          applicationEditStatusUpdatedBy: student.user,
        },
        {
          initialValue: {
            triggerType: AssessmentTriggerType.RelatedApplicationChanged,
            assessmentData,
          },
        },
      ),
    );
    application.currentAssessment = newCurrentAssessment;
    await db.application.save(application);
    // Create and save a new disbursement schedule for the new assessment.
    const newAssessmentDisbursement = createFakeDisbursementSchedule(
      {
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
      },
      { initialValues: { coeUpdatedAt: enrolmentDate1 } },
    );
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
      offeringIntensity: OfferingIntensity.fullTime,
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
        disbursement1EnrolmentDate: enrolmentDate1.toISOString(),
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

  it("Should exclude BC Total Grant from eligible amount calculation when getting NOA details", async () => {
    // Arrange
    const enrolmentDate1 = addDays(1);
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

    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      {
        msfaaNumber,
        student,
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
            "CSLF",
            0,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGP",
            0,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.CanadaGrant,
            "CSGF",
            2520,
          ),
          // BC Grants
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "BCAG",
            140,
          ),
          createFakeDisbursementValue(
            DisbursementValueType.BCGrant,
            "SBSD",
            400,
          ),
        ],
      },
      {
        offeringIntensity: OfferingIntensity.fullTime,
        firstDisbursementInitialValues: { coeUpdatedAt: enrolmentDate1 },
      },
    );

    const assessment = application.currentAssessment;
    const [disbursement] = assessment.disbursementSchedules;

    const endpoint = `/students/assessment/${assessment.id}/noa`;
    const studentUserToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    const expectedNOADetails = {
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      applicationStatus: application.applicationStatus,
      assessment: assessment.assessmentData,
      noaApprovalStatus: assessment.noaApprovalStatus,
      applicationCurrentAssessmentId: application.currentAssessment.id,
      fullName: getUserFullName(application.student.user),
      programName: assessment.offering.educationProgram.name,
      locationName: assessment.offering.institutionLocation.name,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringStudyEndDate: getDateOnlyFullMonthFormat(
        assessment.offering.studyEndDate,
      ),
      offeringStudyStartDate: getDateOnlyFullMonthFormat(
        assessment.offering.studyStartDate,
      ),
      // Sum of CSGF(2520) + BCAG(140) + SBSD(400), excluding BCSG(540)
      eligibleAmount: 3060,
      disbursement: {
        disbursement1COEStatus: disbursement.coeStatus,
        disbursement1Date: getDateOnlyFullMonthFormat(
          disbursement.disbursementDate,
        ),
        disbursement1Id: disbursement.id,
        disbursement1MSFAACancelledDate:
          disbursement.msfaaNumber?.cancelledDate,
        disbursement1MSFAADateSigned: disbursement.msfaaNumber?.dateSigned,
        disbursement1MSFAAId: disbursement.msfaaNumber?.id,
        disbursement1MSFAANumber: msfaaNumber.msfaaNumber,
        disbursement1Status: disbursement.disbursementScheduleStatus,
        disbursement1TuitionRemittance:
          disbursement.tuitionRemittanceRequestedAmount,
        disbursement1cslf: 0,
        disbursement1csgp: 0,
        disbursement1csgf: 2520,
        disbursement1bcag: 140,
        disbursement1sbsd: 400,
        disbursement1EnrolmentDate: enrolmentDate1.toISOString(),
      },
      offeringName: assessment.offering.name,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(expectedNOADetails);
  });

  afterAll(async () => {
    await app?.close();
  });
});
