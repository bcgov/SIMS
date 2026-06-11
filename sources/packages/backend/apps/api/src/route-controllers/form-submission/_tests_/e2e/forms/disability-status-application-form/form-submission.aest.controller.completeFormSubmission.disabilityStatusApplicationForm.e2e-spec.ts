import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
import {
  AESTGroups,
  authorizeDynamicFormConfigurations,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeUser,
  E2EDataSources,
  saveFakeFormSubmissionFromInputTestData,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  DisabilityStatus,
  DynamicFormConfiguration,
  FormCategory,
  FormSubmissionActionType,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
  Student,
  User,
} from "@sims/sims-db";
import MockDate from "mockdate";
import { FormSubmissionAuthRoles } from "../../../../../../services";
import { TestingModule } from "@nestjs/testing";
import { FORM_DEFINITION_NAME } from "./form-constants";

describe(`FormSubmissionAESTController(e2e)-completeFormSubmission-${FORM_DEFINITION_NAME}`, () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  let ministryAPIUser: User;
  let ministryDecisionUser: User;
  let formConfig: DynamicFormConfiguration;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
    ministryDecisionUser = await db.user.save(createFakeUser());
    ministryAPIUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );
    formConfig = await db.dynamicFormConfiguration.findOneOrFail({
      select: { id: true, authorizationKey: true },
      where: { formDefinitionName: FORM_DEFINITION_NAME },
    });
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  // Tests to validate that student disability status is updated based on form submission item decision, student current disability status
  // and requested disability status when disability status application form is completed.
  [
    {
      studentCurrentDisabilityStatus: DisabilityStatus.Requested,
      requestedDisabilityStatus: DisabilityStatus.PD,
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      expectedDisabilityStatus: DisabilityStatus.PD,
      expectedFormSubmissionStatus: FormSubmissionStatus.Completed,
    },
    {
      studentCurrentDisabilityStatus: DisabilityStatus.PPD,
      requestedDisabilityStatus: DisabilityStatus.PD,
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      expectedDisabilityStatus: DisabilityStatus.PD,
      expectedFormSubmissionStatus: FormSubmissionStatus.Completed,
    },
    {
      studentCurrentDisabilityStatus: DisabilityStatus.Requested,
      requestedDisabilityStatus: DisabilityStatus.PPD,
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      expectedDisabilityStatus: DisabilityStatus.PPD,
      expectedFormSubmissionStatus: FormSubmissionStatus.Completed,
    },
    {
      studentCurrentDisabilityStatus: DisabilityStatus.Requested,
      requestedDisabilityStatus: DisabilityStatus.PD,
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      expectedDisabilityStatus: DisabilityStatus.Declined,
      expectedFormSubmissionStatus: FormSubmissionStatus.Declined,
    },
    {
      studentCurrentDisabilityStatus: DisabilityStatus.Requested,
      requestedDisabilityStatus: DisabilityStatus.PPD,
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      expectedDisabilityStatus: DisabilityStatus.Declined,
      expectedFormSubmissionStatus: FormSubmissionStatus.Declined,
    },
  ].forEach(
    ({
      studentCurrentDisabilityStatus,
      requestedDisabilityStatus,
      decisionStatus,
      expectedDisabilityStatus,
      expectedFormSubmissionStatus,
    }) => {
      it(
        `Should complete disability status application form with form submission status ${expectedFormSubmissionStatus}` +
          ` and update student disability status to ${expectedDisabilityStatus}` +
          ` when student current disability status is ${studentCurrentDisabilityStatus}, requested disability status is ${requestedDisabilityStatus}` +
          ` and decision on form submission item is ${decisionStatus}.`,
        async () => {
          // Arrange
          const student = await saveFakeStudent(db.dataSource, undefined, {
            initialValue: { disabilityStatus: studentCurrentDisabilityStatus },
          });
          const formSubmission = await saveFakeFormSubmissionFromInputTestData(
            db,
            {
              student,
              ministryAuditUser: ministryDecisionUser,
              formCategory: FormCategory.StudentForm,
              submissionStatus: FormSubmissionStatus.Pending,
              formSubmissionItems: [
                {
                  dynamicFormConfiguration: formConfig,
                  submittedData: {
                    actions: [
                      FormSubmissionActionType.UpdateDisabilityOnSubmission,
                      FormSubmissionActionType.UpdateDisabilityOnDecision,
                    ],
                    requestedDisabilityStatus,
                  },
                  decisions: [{ decisionStatus }],
                },
              ],
            },
          );
          const [disabilityStatusFormSubmission] =
            formSubmission.formSubmissionItems;
          const payload = {
            items: [
              {
                submissionItemId: disabilityStatusFormSubmission.id,
                lastUpdateDate: disabilityStatusFormSubmission.updatedAt,
              },
            ],
          };
          const endpoint = `/aest/form-submission/${formSubmission.id}/complete`;
          const token = await getAESTToken(AESTGroups.BusinessAdministrators);
          await authorizeDynamicFormConfigurations(
            appModule,
            [formConfig],
            [FormSubmissionAuthRoles.AssessFinalDecision],
          );
          const now = new Date();
          MockDate.set(now);

          // Act/Assert
          await request(app.getHttpServer())
            .patch(endpoint)
            .send(payload)
            .auth(token, BEARER_AUTH_TYPE)
            .expect(HttpStatus.OK);

          // Validate form submission is completed with expected form submission status.
          const isFormSubmissionCompleted = await db.formSubmission.exists({
            where: {
              id: formSubmission.id,
              submissionStatus: expectedFormSubmissionStatus,
            },
          });
          expect(isFormSubmissionCompleted).toBe(true);
          // Expect student disability status and audit information to be updated as expected.
          const updatedStudent = await getStudentDisabilityStatusAndAuditInfo(
            db,
            student.id,
          );
          expect(updatedStudent).toEqual({
            id: student.id,
            disabilityStatus: expectedDisabilityStatus,
            disabilityStatusFormSubmissionItem: {
              id: disabilityStatusFormSubmission.id,
            },
            disabilityStatusUpdatedBy: {
              id: ministryAPIUser.id,
            },
            disabilityStatusUpdatedOn: now,
            disabilityStatusEffectiveDate: now,
            modifier: { id: ministryAPIUser.id },
            updatedAt: now,
          });
        },
      );
    },
  );

  // Tests to validate that student disability status is not updated based on form submission item decision, student current disability status
  // and requested disability status when disability status application form is completed.
  [
    {
      studentCurrentDisabilityStatus: DisabilityStatus.PD,
      requestedDisabilityStatus: DisabilityStatus.PD,
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      expectedFormSubmissionStatus: FormSubmissionStatus.Completed,
    },
    {
      studentCurrentDisabilityStatus: DisabilityStatus.PD,
      requestedDisabilityStatus: DisabilityStatus.PPD,
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      expectedFormSubmissionStatus: FormSubmissionStatus.Completed,
    },
    {
      studentCurrentDisabilityStatus: DisabilityStatus.PPD,
      requestedDisabilityStatus: DisabilityStatus.PPD,
      decisionStatus: FormSubmissionDecisionStatus.Approved,
      expectedFormSubmissionStatus: FormSubmissionStatus.Completed,
    },
    {
      studentCurrentDisabilityStatus: DisabilityStatus.PPD,
      requestedDisabilityStatus: DisabilityStatus.PD,
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      expectedFormSubmissionStatus: FormSubmissionStatus.Declined,
    },
    {
      studentCurrentDisabilityStatus: DisabilityStatus.PD,
      requestedDisabilityStatus: DisabilityStatus.PD,
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      expectedFormSubmissionStatus: FormSubmissionStatus.Declined,
    },
    {
      studentCurrentDisabilityStatus: DisabilityStatus.Declined,
      requestedDisabilityStatus: DisabilityStatus.PD,
      decisionStatus: FormSubmissionDecisionStatus.Declined,
      expectedFormSubmissionStatus: FormSubmissionStatus.Declined,
    },
  ].forEach(
    ({
      studentCurrentDisabilityStatus,
      requestedDisabilityStatus,
      decisionStatus,
      expectedFormSubmissionStatus,
    }) => {
      it(
        `Should complete disability status application form with form submission status ${expectedFormSubmissionStatus}` +
          ` but not update student disability status` +
          ` when student current disability status is ${studentCurrentDisabilityStatus}, requested disability status is ${requestedDisabilityStatus}` +
          ` and decision on form submission item is ${decisionStatus}.`,
        async () => {
          // Arrange
          const student = await saveFakeStudent(db.dataSource, undefined, {
            initialValue: { disabilityStatus: studentCurrentDisabilityStatus },
          });
          const formSubmission = await saveFakeFormSubmissionFromInputTestData(
            db,
            {
              student,
              ministryAuditUser: ministryDecisionUser,
              formCategory: FormCategory.StudentForm,
              submissionStatus: FormSubmissionStatus.Pending,
              formSubmissionItems: [
                {
                  dynamicFormConfiguration: formConfig,
                  submittedData: {
                    actions: [
                      FormSubmissionActionType.UpdateDisabilityOnSubmission,
                      FormSubmissionActionType.UpdateDisabilityOnDecision,
                    ],
                    requestedDisabilityStatus,
                  },
                  decisions: [{ decisionStatus }],
                },
              ],
            },
          );
          const [disabilityStatusFormSubmission] =
            formSubmission.formSubmissionItems;
          const payload = {
            items: [
              {
                submissionItemId: disabilityStatusFormSubmission.id,
                lastUpdateDate: disabilityStatusFormSubmission.updatedAt,
              },
            ],
          };
          const endpoint = `/aest/form-submission/${formSubmission.id}/complete`;
          const token = await getAESTToken(AESTGroups.BusinessAdministrators);
          await authorizeDynamicFormConfigurations(
            appModule,
            [formConfig],
            [FormSubmissionAuthRoles.AssessFinalDecision],
          );
          const now = new Date();
          MockDate.set(now);

          // Act/Assert
          await request(app.getHttpServer())
            .patch(endpoint)
            .send(payload)
            .auth(token, BEARER_AUTH_TYPE)
            .expect(HttpStatus.OK);

          // Validate form submission is completed with expected form submission status.
          const isFormSubmissionCompleted = await db.formSubmission.exists({
            where: {
              id: formSubmission.id,
              submissionStatus: expectedFormSubmissionStatus,
            },
          });
          expect(isFormSubmissionCompleted).toBe(true);
          // Expect student disability status and audit information not to be updated.
          const notUpdatedStudent =
            await getStudentDisabilityStatusAndAuditInfo(db, student.id);
          expect(notUpdatedStudent.disabilityStatus).toBe(
            studentCurrentDisabilityStatus,
          );
          expect(
            notUpdatedStudent.disabilityStatusFormSubmissionItem,
          ).toBeNull();
          expect(notUpdatedStudent.disabilityStatusUpdatedBy).toBeNull();
          expect(notUpdatedStudent.disabilityStatusUpdatedOn).toBeNull();
          expect(notUpdatedStudent.disabilityStatusEffectiveDate).toBeNull();
          expect(notUpdatedStudent.modifier).not.toEqual({
            id: ministryAPIUser.id,
          });
          expect(notUpdatedStudent.updatedAt).not.toBe(now);
        },
      );
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get student disability status and audit information related to disability status update.
 * @param db E2EDataSources
 * @param studentId number
 * @returns Student disability status and audit information.
 */
function getStudentDisabilityStatusAndAuditInfo(
  db: E2EDataSources,
  studentId: number,
): Promise<Student> {
  return db.student.findOneOrFail({
    select: {
      id: true,
      disabilityStatus: true,
      disabilityStatusFormSubmissionItem: { id: true },
      disabilityStatusUpdatedBy: { id: true },
      disabilityStatusUpdatedOn: true,
      disabilityStatusEffectiveDate: true,
      modifier: { id: true },
      updatedAt: true,
    },
    relations: {
      disabilityStatusFormSubmissionItem: true,
      disabilityStatusUpdatedBy: true,
      modifier: true,
    },
    loadEagerRelations: false,
    where: { id: studentId },
  });
}
