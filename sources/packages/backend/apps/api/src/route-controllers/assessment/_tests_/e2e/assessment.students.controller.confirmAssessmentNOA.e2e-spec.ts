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
  ApplicationStatus,
  AssessmentStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementScheduleStatus,
  DisbursementValueType,
  OfferingIntensity,
  WorkflowData,
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

  it("Should allow NOA approval for the current application assessment when the application has multiple assessments.", async () => {
    // Arrange
    const { currentAssessmentId } = await createApplicationAndAssessments();
    const currentEndpoint = `/students/assessment/${currentAssessmentId}/confirm-assessment`;
    const studentUserToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(currentEndpoint)
      .auth(studentUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const updatedAssessment = await db.studentAssessment.findOne({
      select: {
        id: true,
        noaApprovalStatus: true,
      },
      where: { id: currentAssessmentId },
    });

    expect(updatedAssessment).toEqual({
      id: currentAssessmentId,
      noaApprovalStatus: AssessmentStatus.completed,
    });
  });

  it("Should not allow NOA approval for old application assessments when the application has multiple assessments.", async () => {
    // Arrange
    const { oldAssessmentId } = await createApplicationAndAssessments();
    const oldEndpoint = `/students/assessment/${oldAssessmentId}/confirm-assessment`;
    const studentUserToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(oldEndpoint)
      .auth(studentUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should not allow NOA approval when the current assessment has some e-Cert blocking validations(invalid MSFAA).", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Mock user services to return the saved student.
    await mockUserLoginInfo(appModule, student);
    const application = await saveFakeApplicationDisbursements(
      db.dataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.Assessment,
        offeringIntensity: OfferingIntensity.partTime,
        firstDisbursementInitialValues: {
          coeStatus: COEStatus.required,
          disbursementScheduleStatus: DisbursementScheduleStatus.Pending,
        },
      },
    );
    const studentUserToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const endpoint = `/students/assessment/${application.currentAssessment.id}/confirm-assessment`;
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(studentUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "There is at least one e-Cert validation failed preventing the assessment from being accepted.",
        error: "Unprocessable Entity",
      });
  });

  /**
   * Creates an application with two assessments.
   * @returns Old and new Assessment ID.
   */
  async function createApplicationAndAssessments(): Promise<{
    currentAssessmentId: number;
    oldAssessmentId: number;
  }> {
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
            workflowData: { calculatedData: {} } as WorkflowData,
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
    return {
      currentAssessmentId: newCurrentAssessment.id,
      oldAssessmentId: oldAssessment.id,
    };
  }

  afterAll(async () => {
    await app?.close();
  });
});
