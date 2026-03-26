import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeSupportingUser,
  E2EDataSources,
  getProviderInstanceForModule,
  saveFakeApplication,
  saveFakeFormSubmissionFromInputTestData,
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
  NotificationMessageType,
  User,
} from "@sims/sims-db";
import { AppStudentsModule } from "../../../../app.students.module";
import {
  FORM_SUBMISSION_PENDING_DECISION,
  FormService,
} from "../../../../services";
import MockDate from "mockdate";
import {
  getDateOnlyFormat,
  getPSTPDTDateTime,
} from "@sims/utilities/date-utils";
import { IsNull } from "typeorm";
import { SystemUsersService } from "@sims/services";

describe("FormSubmissionStudentsController(e2e)-submitForm", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let formConfigs: DynamicConfigurationTestData;
  let formService: FormService;
  let systemUser: User;
  const MINISTRY_EMAIL_ADDRESS = "dummy@some.domain";

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    formConfigs = await createFakeFormConfigurations(app, db);
    formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
    systemUser = app.get(SystemUsersService).systemUser;
    // Update fake email contacts to send ministry notifications.
    await db.notificationMessage.update(
      {
        id: NotificationMessageType.MinistryFormSubmitted,
      },
      { emailContacts: [MINISTRY_EMAIL_ADDRESS] },
    );
  });

  beforeEach(async () => {
    // Clear all mocks.
    jest.clearAllMocks();
    await resetMockJWTUserInfo(appModule);
    MockDate.reset();
    // Set the date sent for the notifications tested in these scenarios
    // to some value to ensure they are retrieved in the tests.
    await db.notification.update(
      {
        notificationMessage: {
          id: NotificationMessageType.MinistryFormSubmitted,
        },
      },
      { dateSent: new Date() },
    );
  });

  it("Should submit a student appeal with multiple items, an associated application, with supplementary data, an updated file, and send a Ministry notification when the student has no pending submissions.", async () => {
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
    await mockJWTUserInfo(appModule, student.user);

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
    const studentUser = { id: student.user.id };
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
    // Validate notification.
    const notification = await db.notification.findOne({
      select: {
        id: true,
        notificationMessage: { id: true },
        messagePayload: true,
        creator: { id: true },
      },
      relations: { notificationMessage: true, creator: true },
      where: {
        dateSent: IsNull(),
        notificationMessage: {
          id: NotificationMessageType.MinistryFormSubmitted,
        },
      },
      loadEagerRelations: false,
    });
    expect(notification).toEqual({
      id: expect.any(Number),
      notificationMessage: {
        id: NotificationMessageType.MinistryFormSubmitted,
      },
      creator: systemUser,
      messagePayload: {
        email_address: MINISTRY_EMAIL_ADDRESS,
        template_id: "296aa2ea-dfa7-4285-9d5b-315b2a4911d6",
        personalisation: {
          givenNames: student.user.firstName,
          lastName: student.user.lastName,
          birthDate: getDateOnlyFormat(student.birthDate),
          studentEmail: student.user.email,
          formCategory: FormCategory.StudentAppeal,
          formNames: [
            formConfigs.studentAppealApplicationA.formType,
            formConfigs.studentAppealApplicationB.formType,
          ],
          applicationNumber: application.applicationNumber,
          dateTime: `${getPSTPDTDateTime(now)} PST/PDT`,
        },
      },
    });
  });

  it("Should submit a student form with a single item, no application, with no supplementary data, updating file, and sending a Ministry notification when the student has no pending submissions.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const student = await saveFakeStudent(db.dataSource);
    // Create a student file to ensure its type was updated.
    const studentFile = await saveFakeStudentFileUpload(db.dataSource, {
      student,
    });
    // Minimum payload to validate the submission.
    const payload = {
      items: [
        {
          dynamicConfigurationId: formConfigs.studentFormA.id,
          formData: {
            propertyA: "some value for property A",
          },
          files: [studentFile.uniqueFileName],
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
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    let createdSubmissionId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => (createdSubmissionId = +response.body.id));
    // Validate if dryRun was invoked.
    expect(dryRunSubmissionMock).toHaveBeenCalledWith(
      formConfigs.studentFormA.formDefinitionName,
      {
        propertyA: "some value for property A",
      },
    );

    // Validate persisted data in the database.
    const studentUser = { id: student.user.id };
    const createdSubmission = await db.formSubmission.findOne({
      select: {
        id: true,
        student: { id: true },
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
      submittedDate: now,
      submissionStatus: FormSubmissionStatus.Pending,
      formCategory: FormCategory.StudentForm,
      creator: studentUser,
      createdAt: now,
      formSubmissionItems: [
        {
          id: expect.any(Number),
          dynamicFormConfiguration: {
            id: formConfigs.studentFormA.id,
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
      fileOrigin: FileOriginType.FormSubmission,
      modifier: studentUser,
    });
    // Validate notification.
    const notification = await db.notification.findOne({
      select: {
        id: true,
        notificationMessage: { id: true },
        messagePayload: true,
        creator: { id: true },
      },
      relations: { notificationMessage: true, creator: true },
      where: {
        dateSent: IsNull(),
        notificationMessage: {
          id: NotificationMessageType.MinistryFormSubmitted,
        },
      },
      loadEagerRelations: false,
    });
    expect(notification).toEqual({
      id: expect.any(Number),
      notificationMessage: {
        id: NotificationMessageType.MinistryFormSubmitted,
      },
      creator: systemUser,
      messagePayload: {
        email_address: MINISTRY_EMAIL_ADDRESS,
        template_id: "296aa2ea-dfa7-4285-9d5b-315b2a4911d6",
        personalisation: {
          givenNames: student.user.firstName,
          lastName: student.user.lastName,
          birthDate: getDateOnlyFormat(student.birthDate),
          studentEmail: student.user.email,
          formCategory: FormCategory.StudentForm,
          formNames: [formConfigs.studentFormA.formType],
          applicationNumber: "N/A",
          dateTime: `${getPSTPDTDateTime(now)} PST/PDT`,
        },
      },
    });
  });

  it("Should throw an unprocessable entity error when a student appeal is submitted and the current assessment does not have the form on its eligible applications list.", async () => {
    // Arrange
    // Create a student with a valid SIN required to the eligibility criteria.
    const student = await saveFakeStudent(db.dataSource);
    // Create an application to be associated with the appeal forms and make the appeal forms eligible for the application.
    // Include another form in the eligible list.
    const application = await saveFakeApplication(
      db.dataSource,
      { student },
      {
        initialValues: { applicationStatus: ApplicationStatus.Completed },
        currentAssessmentInitialValues: {
          eligibleApplicationAppeals: [
            formConfigs.studentAppealApplicationB.formDefinitionName,
          ],
        },
      },
    );
    // Minimum payload to validate the submission.
    const payload = {
      applicationId: application.id,
      items: [
        {
          dynamicConfigurationId: formConfigs.studentAppealApplicationA.id,
          formData: {},
          files: [],
        },
      ],
    };
    const endpoint = "/students/form-submission";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, application.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `The submitted appeal form(s) ${formConfigs.studentAppealApplicationA.formDefinitionName} is/are not eligible for the application.`,
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity error when an application ID is provided for a student appeal that does not have an application scope.", async () => {
    // Arrange
    const application = await saveFakeApplication(db.dataSource);
    // Minimum payload to validate the submission.
    const payload = {
      applicationId: application.id,
      items: [
        {
          dynamicConfigurationId: formConfigs.studentAppealA.id,
          formData: {},
          files: [],
        },
      ],
    };
    const endpoint = "/students/form-submission";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, application.student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "All forms in the submission must have an application ID when they have application scope and must not have one otherwise.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity error when submitting a student form when the student already has a pending submission for the same context.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    await saveFakeFormSubmissionFromInputTestData(db, {
      student,
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfigs.studentFormA,
          decisions: [],
        },
      ],
    });
    // Minimum payload to validate the submission.
    const payload = {
      items: [
        {
          dynamicConfigurationId: formConfigs.studentFormA.id,
          formData: { property: "value" },
          files: [],
        },
      ],
    };
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
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "There is already a pending form submission for the same context.",
        errorType: FORM_SUBMISSION_PENDING_DECISION,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
