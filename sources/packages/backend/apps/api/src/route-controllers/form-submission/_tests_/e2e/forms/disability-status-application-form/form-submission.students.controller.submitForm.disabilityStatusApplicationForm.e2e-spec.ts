import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
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
  E2EDataSources,
  saveFakeStudent,
  saveFakeStudentFileUpload,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import {
  DisabilityStatus,
  DynamicFormConfiguration,
  StudentFile,
} from "@sims/sims-db";
import MockDate from "mockdate";
import { FORM_DEFINITION_NAME } from "./form-constants";

describe(`FormSubmissionStudentsController(e2e)-submitForm-${FORM_DEFINITION_NAME}`, () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let formConfig: DynamicFormConfiguration;

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
  });

  beforeEach(async () => {
    // Clear all mocks.
    jest.clearAllMocks();
    await resetMockJWTUserInfo(appModule);
    MockDate.reset();
  });

  // Tests to validate that disability status is updated to "Requested"
  // when disability status application form is submitted based on current disability status.
  [
    {
      currentDisabilityStatus: DisabilityStatus.NotRequested,
      expectedDisabilityStatus: DisabilityStatus.Requested,
    },
    {
      currentDisabilityStatus: DisabilityStatus.Declined,
      expectedDisabilityStatus: DisabilityStatus.Requested,
    },
  ].forEach(({ currentDisabilityStatus, expectedDisabilityStatus }) => {
    it(`Should submit disability status application form and update the disability status to '${expectedDisabilityStatus}' when current student disability status is '${currentDisabilityStatus}'.`, async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource, undefined, {
        initialValue: { disabilityStatus: currentDisabilityStatus },
      });
      // Create a student file to ensure its type was updated.
      const studentFile = await saveFakeStudentFileUpload(db.dataSource, {
        student,
      });
      // Payload to validate the submission.
      const payload = getDisabilityStatusFormData(formConfig.id, studentFile);

      const endpoint = "/students/form-submission";
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, student.user);

      // Mock the current date to validate audit dates.
      const now = new Date();
      MockDate.set(now);

      // Act/Assert
      let createdSubmissionId: number;
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => (createdSubmissionId = +response.body.id));

      // Assert the created form submission and form submission actions.
      const formSubmissionPromise = db.formSubmission.findOneOrFail({
        select: {
          id: true,
          formSubmissionItems: { id: true, submittedData: true },
        },
        relations: { formSubmissionItems: true },
        where: { id: createdSubmissionId },
      });
      const studentPromise = db.student.findOne({
        select: {
          id: true,
          disabilityStatus: true,
          disabilityStatusUpdatedBy: { id: true },
          disabilityStatusUpdatedOn: true,
        },
        relations: { disabilityStatusUpdatedBy: true },
        where: { id: student.id },
        loadEagerRelations: false,
      });
      const [formSubmission, updatedStudent] = await Promise.all([
        formSubmissionPromise,
        studentPromise,
      ]);
      expect(formSubmission.id).toBe(createdSubmissionId);
      const [formSubmissionItem] = formSubmission.formSubmissionItems;
      const [expectedFormSubmissionItem] = payload.items;
      expect(formSubmissionItem.submittedData).toEqual(
        expectedFormSubmissionItem.formData,
      );
      expect(updatedStudent).toEqual({
        id: student.id,
        disabilityStatus: expectedDisabilityStatus,
        disabilityStatusUpdatedBy: {
          id: student.user.id,
        },
        disabilityStatusUpdatedOn: now,
      });
    });
  });

  // Tests to validate that disability status is not updated
  // when disability status application form is submitted based on current disability status.
  [
    DisabilityStatus.PD,
    DisabilityStatus.PPD,
    DisabilityStatus.Requested,
  ].forEach((currentDisabilityStatus) => {
    it(`Should submit disability status application form but not update the disability status when current student disability status is '${currentDisabilityStatus}'.`, async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource, undefined, {
        initialValue: { disabilityStatus: currentDisabilityStatus },
      });
      // Create a student file to ensure its type was updated.
      const studentFile = await saveFakeStudentFileUpload(db.dataSource, {
        student,
      });
      // Payload to validate the submission.
      const payload = getDisabilityStatusFormData(formConfig.id, studentFile);

      const endpoint = "/students/form-submission";
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, student.user);

      // Mock the current date to validate audit dates.
      const now = new Date();
      MockDate.set(now);

      // Act/Assert
      let createdSubmissionId: number;
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => (createdSubmissionId = +response.body.id));

      // Assert the created form submission and form submission actions.
      const formSubmissionPromise = db.formSubmission.findOneOrFail({
        select: {
          id: true,
          formSubmissionItems: { id: true, submittedData: true },
        },
        relations: { formSubmissionItems: true },
        where: { id: createdSubmissionId },
      });
      const studentPromise = db.student.findOne({
        select: {
          id: true,
          disabilityStatus: true,
          disabilityStatusUpdatedBy: { id: true },
          disabilityStatusUpdatedOn: true,
        },
        relations: { disabilityStatusUpdatedBy: true },
        where: { id: student.id },
        loadEagerRelations: false,
      });
      const [formSubmission, updatedStudent] = await Promise.all([
        formSubmissionPromise,
        studentPromise,
      ]);
      expect(formSubmission.id).toBe(createdSubmissionId);
      const [formSubmissionItem] = formSubmission.formSubmissionItems;
      const [expectedFormSubmissionItem] = payload.items;
      expect(formSubmissionItem.submittedData).toEqual(
        expectedFormSubmissionItem.formData,
      );
      // Validate that disability status was not updated.
      expect(updatedStudent!.disabilityStatus).toBe(currentDisabilityStatus);
      // Validate that audit fields were not updated since disability status was not updated.
      expect(updatedStudent!.disabilityStatusUpdatedBy).toBeNull();
      expect(updatedStudent!.disabilityStatusUpdatedOn).toBeNull();
    });
  });

  it(`Should throw bad request error when requested disability status in form data is invalid.`, async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // Create a student file to ensure its type was updated.
    const studentFile = await saveFakeStudentFileUpload(db.dataSource, {
      student,
    });
    // Payload to validate the submission.
    const payload = getDisabilityStatusFormData(formConfig.id, studentFile, {
      requestedDisabilityStatus: "InvalidStatus",
    });

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
 * Get the form data for disability status application form submission.
 * @param dynamicFormConfigId dynamic form configuration id for disability status application form.
 * @param studentFile student file information for the form submission.
 * @param options optional values to override default form data used for test scenarios.
 * - `requestedDisabilityStatus` requested disability status to include in the form data.
 * @returns form data.
 */
function getDisabilityStatusFormData(
  dynamicFormConfigId: number,
  studentFile: StudentFile,
  options?: { requestedDisabilityStatus?: string },
) {
  return {
    items: [
      {
        dynamicConfigurationId: dynamicFormConfigId,
        formData: {
          actions: [
            "UpdateDisabilityOnSubmission",
            "UpdateDisabilityOnDecision",
          ],
          requestedDisabilityStatus: options?.requestedDisabilityStatus ?? "PD",
          disabilityCategories: {
            specificLearningDisorder: false,
            visualConditions: true,
            auditoryConditions: true,
            otherDisablingConditions: false,
          },
          requiredDocuments: [
            {
              storage: "url",
              originalName: studentFile.fileName,
              name: studentFile.uniqueFileName,
              url: `student/files/${studentFile.uniqueFileName}`,
              size: 10,
              type: "text/plain",
              hash: "",
            },
          ],
          declaration: true,
        },
        files: [studentFile.uniqueFileName],
      },
    ],
  };
}
