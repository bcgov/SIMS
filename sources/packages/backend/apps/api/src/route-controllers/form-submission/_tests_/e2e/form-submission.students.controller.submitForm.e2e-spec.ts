import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeSupportingUser,
  E2EDataSources,
  getProviderInstanceForModule,
  saveFakeApplication,
  saveFakeStudent,
  saveFakeStudentFileUpload,
} from "@sims/test-utils";
import {
  createFakeFormConfigurations,
  DynamicConfigurationTestData,
} from "./form-submission-utils";
import { TestingModule } from "@nestjs/testing";
import {
  ApplicationStatus,
  FileOriginType,
  FormCategory,
  FormSubmissionStatus,
} from "@sims/sims-db";
import { AppStudentsModule } from "../../../../app.students.module";
import { FormService } from "../../../../services";
import MockDate from "mockdate";

describe("FormSubmissionStudentsController(e2e)-submitForm", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let formConfigs: DynamicConfigurationTestData;
  let formService: FormService;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    formConfigs = await createFakeFormConfigurations(db);
    formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
  });

  beforeEach(async () => {
    // Clear all mocks.
    jest.clearAllMocks();
    MockDate.reset();
  });

  it("Should submit a student appeal with multiple items, an associated application, and supplementary data when the student has no pending submissions.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    // Create a student with a valid SIN required to the eligibility criteria.
    const student = await saveFakeStudent(db.dataSource);
    // Create a student file to ensure its type was updated.
    const studentFile = await saveFakeStudentFileUpload(db.dataSource, {
      student,
    });
    // Create an application to be associated with the appeal forms and make the appeal forms eligible for the application.
    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      {
        initialValues: { applicationStatus: ApplicationStatus.Completed },
        currentAssessmentInitialValues: {
          eligibleApplicationAppeals: [
            formConfigs.studentAppealApplicationA.formDefinitionName,
            formConfigs.studentAppealApplicationB.formDefinitionName,
          ],
        },
      },
    );
    // Create the supporting user to be associated with the application.
    // Required to test the 'parents' supplementary data in the form submission.
    const parent = await db.supportingUser.save(
      createFakeSupportingUser(
        {
          application,
        },
        { initialValues: { fullName: "Parent full name" } },
      ),
    );
    // Minimum payload to validate the submission.
    const payload = {
      applicationId: application.id,
      items: [
        {
          dynamicConfigurationId: formConfigs.studentAppealApplicationA.id,
          formData: {
            programYear: "some program year",
            propertyA: "some value for property A",
          },
          files: [studentFile.uniqueFileName],
        },
        {
          dynamicConfigurationId: formConfigs.studentAppealApplicationB.id,
          formData: {
            parents: [{ parentData: "some parent data" }],
            propertyB: "some value for property B",
          },
          files: [],
        },
      ],
    };
    const submittedDataDryRunResult = { someData: "someValue" };
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: "some form name",
      data: { data: submittedDataDryRunResult },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;

    const endpoint = "/students/form-submission";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, application.student.user);

    // Act/Assert
    let createdSubmissionId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => (createdSubmissionId = +response.body.id));

    // Validate supplementary data loading before the dry-run submission.
    // First call loading program year supplementary data for the first item.
    expect(dryRunSubmissionMock).toHaveBeenNthCalledWith(
      1,
      formConfigs.studentAppealApplicationA.formDefinitionName,
      {
        programYear: application.programYear.programYear,
        propertyA: "some value for property A",
      },
    );
    // Second call loading parents supplementary data for the second item.
    expect(dryRunSubmissionMock).toHaveBeenNthCalledWith(
      2,
      formConfigs.studentAppealApplicationB.formDefinitionName,
      {
        parents: [{ id: parent.id, fullName: parent.fullName }],
        propertyB: "some value for property B",
      },
    );

    // Validate persisted data in the database.
    const studentUser = { id: application.student.user.id };
    const createdSubmission = await db.formSubmission.findOne({
      select: {
        id: true,
        student: { id: true },
        application: { id: true },
        submittedDate: true,
        submissionStatus: true,
        formCategory: true,
        creator: { id: true },
        createdAt: true,
        formSubmissionItems: {
          id: true,
          dynamicFormConfiguration: { id: true },
          submittedData: true,
          creator: { id: true },
          createdAt: true,
        },
      },
      relations: {
        student: true,
        application: true,
        creator: true,
        formSubmissionItems: {
          dynamicFormConfiguration: true,
          creator: true,
        },
      },
      where: { id: createdSubmissionId },
      loadEagerRelations: false,
    });
    expect(createdSubmission).toEqual({
      id: createdSubmissionId,
      student: { id: student.id },
      application: { id: application.id },
      submittedDate: now,
      submissionStatus: FormSubmissionStatus.Pending,
      formCategory: FormCategory.StudentAppeal,
      creator: studentUser,
      createdAt: now,
      formSubmissionItems: [
        {
          id: expect.any(Number),
          dynamicFormConfiguration: {
            id: formConfigs.studentAppealApplicationA.id,
          },
          submittedData: submittedDataDryRunResult,
          creator: studentUser,
          createdAt: now,
        },
        {
          id: expect.any(Number),
          dynamicFormConfiguration: {
            id: formConfigs.studentAppealApplicationB.id,
          },
          submittedData: submittedDataDryRunResult,
          creator: studentUser,
          createdAt: now,
        },
      ],
    });
    // Validate the student file was updated with the correct file origin.
    const updatedStudentFile = await db.studentFile.findOne({
      select: { id: true, fileOrigin: true, modifier: { id: true } },
      relations: { modifier: true },
      where: { id: studentFile.id },
    });
    expect(updatedStudentFile).toEqual({
      id: studentFile.id,
      fileOrigin: FileOriginType.Appeal,
      modifier: studentUser,
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
