import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeStudentScholasticStanding,
  createFakeUser,
  E2EDataSources,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import {
  Application,
  ApplicationStatus,
  DynamicFormConfiguration,
  Student,
  StudentScholasticStanding,
  StudentScholasticStandingChangeType,
  User,
} from "@sims/sims-db";
import { FORM_DEFINITION_NAME } from "./form-constants";
import { FormSubmissionAPIInDTO } from "../../../../models/form-submission.dto";

interface ApplicationWithWithdrawal {
  application: Application;
  scholasticStandingWithdrawal: StudentScholasticStanding;
}
describe(`FormSubmissionStudentsController(e2e)-submitForm-${FORM_DEFINITION_NAME}`, () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let formConfig: DynamicFormConfiguration;
  let auditUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    formConfig = await db.dynamicFormConfiguration.findOneOrFail({
      select: { id: true },
      where: { formDefinitionName: FORM_DEFINITION_NAME },
    });
    auditUser = await db.user.save(createFakeUser());
  });

  beforeEach(async () => {
    // Clear all mocks.
    jest.clearAllMocks();
    await resetMockJWTUserInfo(appModule);
  });

  it(
    `Should submit non-punitive withdrawal form for an application with scholastic standing type ${StudentScholasticStandingChangeType.StudentWithdrewFromProgram}` +
      " when the scholastic standing change is active and not already marked as non-punitive.",
    async () => {
      // Arrange
      const { student, applications } = await createApplicationsWithWithdrawal(
        db,
        auditUser,
      );
      const [firstApplication] = applications;
      // Payload to validate the submission.
      const payload = getNonPunitiveWithdrawalFormData(
        formConfig.id,
        applications,
        firstApplication.scholasticStandingWithdrawal.id,
      );

      const endpoint = "/students/form-submission";
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, student.user);

      // Act/Assert
      let createdSubmissionId: number;
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => (createdSubmissionId = +response.body.id));

      // Assert the created form submission.
      const formSubmission = await db.formSubmission.findOneOrFail({
        select: {
          id: true,
          formSubmissionItems: { id: true, submittedData: true },
        },
        relations: { formSubmissionItems: true },
        where: { id: createdSubmissionId },
      });
      expect(formSubmission.id).toBe(createdSubmissionId);
      const [formSubmissionItem] = formSubmission.formSubmissionItems;
      const [expectedFormSubmissionItem] = payload.items;
      expect(formSubmissionItem.submittedData).toEqual(
        expectedFormSubmissionItem.formData,
      );
    },
  );

  it(`Should throw bad request error when requested scholastic standing withdrawal id in form data is invalid.`, async () => {
    // Arrange
    const { student, applications } = await createApplicationsWithWithdrawal(
      db,
      auditUser,
    );
    // Payload to validate the submission.
    const payload = getNonPunitiveWithdrawalFormData(
      formConfig.id,
      applications,
      999999, // Invalid scholastic standing withdrawal id.
    );

    const endpoint = "/students/form-submission";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: "Failed to submit the form due to invalid dynamic data.",
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Create applications with reported scholastic standing change type withdrawal for a student.
 * @param db E2E data sources.
 * @param auditUser Audit user to create scholastic standing.
 * @param applicationsCount Number of applications to be created with withdrawal for a student.
 * @returns Student and applications with withdrawal.
 */
async function createApplicationsWithWithdrawal(
  db: E2EDataSources,
  auditUser: User,
  applicationsCount = 1,
): Promise<{ student: Student; applications: ApplicationWithWithdrawal[] }> {
  const student = await saveFakeStudent(db.dataSource);
  const applications: ApplicationWithWithdrawal[] = [];
  for (let i = 0; i < applicationsCount; i++) {
    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      {
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    const scholasticStandingWithdrawal =
      await db.studentScholasticStanding.save(
        createFakeStudentScholasticStanding(
          { submittedBy: auditUser, application },
          {
            initialValues: {
              changeType:
                StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
            },
          },
        ),
      );
    // Link the current assessment to the scholastic standing.
    application.currentAssessment!.studentScholasticStanding =
      scholasticStandingWithdrawal;
    await db.application.save(application);
    applications.push({
      application,
      scholasticStandingWithdrawal,
    });
  }
  return { student, applications };
}

/**
 * Gets the form submission data for non-punitive withdrawal form.
 * @param dynamicFormConfigId The ID of the dynamic form configuration.
 * @param eligibleApplications The list of eligible applications with withdrawal information.
 * @param scholasticStandingWithdrawalId The ID of the scholastic standing withdrawal.
 * @param options Options to generate the form data.
 * - `eligibleCircumstances` Eligible circumstances for the non-punitive withdrawal.
 * @returns The form submission data.
 */
function getNonPunitiveWithdrawalFormData(
  dynamicFormConfigId: number,
  eligibleApplications: ApplicationWithWithdrawal[],
  scholasticStandingWithdrawalId: number,
  options?: { eligibleCircumstances?: string },
): FormSubmissionAPIInDTO {
  return {
    items: [
      {
        dynamicConfigurationId: dynamicFormConfigId,
        formData: {
          actions: ["UpdateNonPunitiveScholasticStandingWithdrawal"],
          eligibleCircumstances:
            options?.eligibleCircumstances ?? "withdrawnFromStudies",
          nonPunitiveWithdrawalId: scholasticStandingWithdrawalId,
          scholasticStandingWithdrawals: eligibleApplications.map(
            (application) => ({
              applicationNumber: application.application.applicationNumber,
              scholasticStandingId: application.scholasticStandingWithdrawal.id,
            }),
          ),
        },
        files: [],
      },
    ],
  };
}
