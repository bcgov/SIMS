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
  E2EDataSources,
  saveFakeFormSubmissionFromInputTestData,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import {
  DisabilityStatus,
  DynamicFormConfiguration,
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionStatus,
  Student,
} from "@sims/sims-db";
import MockDate from "mockdate";
import { FORM_DEFINITION_NAME } from "./form-constants";

describe(`FormSubmissionStudentsController(e2e)-cancelForm-${FORM_DEFINITION_NAME}`, () => {
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

  it(`Should cancel disability status application form and revert disability status to '${DisabilityStatus.NotRequested}' when current student disability status is '${DisabilityStatus.Requested}'.`, async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource, undefined, {
      initialValue: { disabilityStatus: DisabilityStatus.Requested },
    });
    const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
      student,
      formCategory: FormCategory.StudentForm,
      submissionStatus: FormSubmissionStatus.Pending,
      formSubmissionItems: [
        {
          dynamicFormConfiguration: formConfig,
          submittedData: {
            actions: [
              FormSubmissionActionType.UpdateDisabilityOnSubmission,
              FormSubmissionActionType.UpdateDisabilityOnDecision,
              FormSubmissionActionType.UpdateDisabilityOnCancel,
            ],
            requestedDisabilityStatus: DisabilityStatus.PD,
          },
          decisions: [],
        },
      ],
    });

    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    await mockJWTUserInfo(appModule, student.user);

    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(formSubmission.id))
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const updatedStudent = await getStudentDisabilityStatus(db, student.id);
    expect(updatedStudent).toEqual({
      id: student.id,
      disabilityStatus: DisabilityStatus.NotRequested,
      disabilityStatusUpdatedBy: { id: student.user.id },
      disabilityStatusUpdatedOn: now,
      modifier: { id: student.user.id },
      updatedAt: now,
    });
  });

  // Tests to validate that disability status is not updated
  // when disability status application form is cancelled based on current disability status.
  [
    DisabilityStatus.PD,
    DisabilityStatus.PPD,
    DisabilityStatus.Declined,
    DisabilityStatus.NotRequested,
  ].forEach((currentDisabilityStatus) => {
    it(`Should cancel disability status application form and not change disability status when current student disability status is '${currentDisabilityStatus}'.`, async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource, undefined, {
        initialValue: { disabilityStatus: currentDisabilityStatus },
      });
      const formSubmission = await saveFakeFormSubmissionFromInputTestData(db, {
        student,
        formCategory: FormCategory.StudentForm,
        submissionStatus: FormSubmissionStatus.Pending,
        formSubmissionItems: [
          {
            dynamicFormConfiguration: formConfig,
            submittedData: {
              actions: [
                FormSubmissionActionType.UpdateDisabilityOnSubmission,
                FormSubmissionActionType.UpdateDisabilityOnDecision,
                FormSubmissionActionType.UpdateDisabilityOnCancel,
              ],
              requestedDisabilityStatus: DisabilityStatus.PPD,
            },
            decisions: [],
          },
        ],
      });

      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      await mockJWTUserInfo(appModule, student.user);

      // Act/Assert
      await request(app.getHttpServer())
        .patch(getEndpoint(formSubmission.id))
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);

      const updatedStudent = await getStudentDisabilityStatus(db, student.id);
      // Validate that disability status was not updated.
      expect(updatedStudent.disabilityStatus).toBe(currentDisabilityStatus);
      // Validate that audit fields were not updated since disability status was not updated.
      expect(updatedStudent.disabilityStatusUpdatedBy).toBeNull();
      expect(updatedStudent.disabilityStatusUpdatedOn).toBeNull();
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the endpoint to cancel a student form submission.
 * @param formSubmissionId form submission ID.
 * @returns Endpoint to cancel the form submission.
 */
function getEndpoint(formSubmissionId: number): string {
  return `/students/form-submission/${formSubmissionId}/cancel`;
}

/**
 * Retrieves the student's disability status and related audit fields for assertions.
 * @param db E2E data sources.
 * @param studentId student ID.
 * @returns Student disability status and audit information.
 */
function getStudentDisabilityStatus(
  db: E2EDataSources,
  studentId: number,
): Promise<Student> {
  return db.student.findOne({
    select: {
      id: true,
      disabilityStatus: true,
      disabilityStatusUpdatedBy: { id: true },
      disabilityStatusUpdatedOn: true,
      modifier: { id: true },
      updatedAt: true,
    },
    relations: { disabilityStatusUpdatedBy: true, modifier: true },
    where: { id: studentId },
    loadEagerRelations: false,
  });
}
