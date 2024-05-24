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
  AssessmentStatus,
  AssessmentTriggerType,
  DisbursementValueType,
  OfferingIntensity,
} from "@sims/sims-db";
import { TestingModule } from "@nestjs/testing";

describe("AssessmentStudentsController(e2e)-confirmAssessmentNOA", () => {
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

  it("Should approve an assessment if requirements for approval are met.", async () => {
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
    const oldAssessment = application.currentAssessment;

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

    const oldEndpoint = `/students/assessment/${oldAssessment.id}/confirm-assessment`;
    const currentEndpoint = `/students/assessment/${application.currentAssessment.id}/confirm-assessment`;

    const studentUserToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(oldEndpoint)
      .auth(studentUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);

    await request(app.getHttpServer())
      .patch(currentEndpoint)
      .auth(studentUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const updatedAssessment = await db.studentAssessment.findOne({
      select: {
        id: true,
        noaApprovalStatus: true,
      },
      where: { id: application.currentAssessment.id },
    });
    expect(updatedAssessment).toEqual({
      id: application.currentAssessment.id,
      noaApprovalStatus: AssessmentStatus.completed,
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
