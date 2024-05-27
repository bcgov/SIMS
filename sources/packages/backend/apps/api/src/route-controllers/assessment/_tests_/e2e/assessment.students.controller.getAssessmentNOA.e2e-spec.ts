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
import { getDateOnlyFormat } from "@sims/utilities";

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
      offeringStudyEndDate: getDateOnlyFormat(assessment.offering.studyEndDate),
      offeringStudyStartDate: getDateOnlyFormat(
        assessment.offering.studyStartDate,
      ),
      eligibleAmount: 2750,
      disbursement: {
        disbursement1COEStatus: newAssessmentDisbursement.coeStatus,
        disbursement1Date: getDateOnlyFormat(
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
    };
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect(expectation);
  });

  afterAll(async () => {
    await app?.close();
  });
});
