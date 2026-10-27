import { INestApplication } from "@nestjs/common";
import {
  DynamicFormConfiguration,
  FormCategory,
  FormSubmissionCancellationReason,
  FormSubmissionStatus,
} from "@sims/sims-db";
import {
  E2EDataSources,
  ensureDynamicFormConfigurationExists,
} from "@sims/test-utils";
import { DynamicFormConfigurationService } from "../../services";

/**
 * Available dynamic configurations to be used in the form submission tests.
 */
export interface DynamicConfigurationTestData {
  /**
   * Student appeal expected to have an associations and possibility of bundled submission.
   */
  studentAppealApplicationA: DynamicFormConfiguration;
  /**
   * Student appeal expected to have an associations and possibility of bundled submission.
   */
  studentAppealApplicationB: DynamicFormConfiguration;
  /**
   * Student appeal, no application associations and no possibility of bundled submission.
   */
  studentAppealA: DynamicFormConfiguration;
  /**
   * Student appeal, no application associations and no possibility of bundled submission.
   */
  studentAppealB: DynamicFormConfiguration;
  /**
   * Student form, no application associations and no possibility of bundled submission.
   */
  studentFormA: DynamicFormConfiguration;
}

/**
 * Create fake dynamic configurations to be shared by the form submission tests.
 * @param app nest application instance to get the necessary services to refresh the dynamic configurations.
 * @param db data sources.
 * @returns an object with dynamic configurations to be used as needed.
 */
export async function createFakeFormConfigurations(
  app: INestApplication,
  db: E2EDataSources,
): Promise<DynamicConfigurationTestData> {
  // Create the form configurations to be used along the tests.
  // The names matter to ensure correct order.
  const [
    studentAppealApplicationA,
    studentAppealApplicationB,
    studentAppealA,
    studentAppealB,
    studentFormA,
  ] = await Promise.all([
    ensureDynamicFormConfigurationExists(db, "Student application appeal A", {
      formCategory: FormCategory.StudentAppeal,
      hasApplicationScope: true,
      allowBundledSubmission: true,
    }),
    ensureDynamicFormConfigurationExists(db, "Student application appeal B", {
      formCategory: FormCategory.StudentAppeal,
      hasApplicationScope: true,
      allowBundledSubmission: true,
    }),
    ensureDynamicFormConfigurationExists(db, "Student appeal A", {
      formCategory: FormCategory.StudentAppeal,
      hasApplicationScope: false,
      allowBundledSubmission: false,
    }),
    ensureDynamicFormConfigurationExists(db, "Student appeal B", {
      formCategory: FormCategory.StudentAppeal,
      hasApplicationScope: false,
      allowBundledSubmission: false,
    }),
    ensureDynamicFormConfigurationExists(db, "Student form A", {
      formCategory: FormCategory.StudentForm,
      hasApplicationScope: false,
      allowBundledSubmission: false,
    }),
  ]);
  await app
    .get(DynamicFormConfigurationService)
    .loadAllDynamicFormConfigurations();
  return {
    studentAppealApplicationA,
    studentAppealApplicationB,
    studentAppealA,
    studentAppealB,
    studentFormA,
  };
}

/**
 * Verify if all the application scoped form submissions are cancelled.
 * @param db E2EDataSources instance to access the database.
 * @param applicationId form submission application ID.
 * @param cancellationReason form submission cancellation reason.
 * @param expectedFormSubmissionIds expected form submission IDs that should be cancelled.
 * @param auditUserId ID of the user who performed the cancellation.
 * @param auditDate date when the cancellation was performed.
 */
export async function assertCancelledApplicationScopedFormSubmissions(
  db: E2EDataSources,
  applicationId: number,
  cancellationReason: FormSubmissionCancellationReason,
  expectedFormSubmissionIds: number[],
  auditUserId: number,
  auditDate: Date,
): Promise<void> {
  // Verify if all the application scoped form submissions are cancelled.
  const updatedFormSubmissions = await db.formSubmission.find({
    select: {
      id: true,
      submissionStatus: true,
      cancellationReason: true,
      submissionStatusUpdatedBy: { id: true },
      submissionStatusUpdatedOn: true,
      modifier: { id: true },
      updatedAt: true,
    },
    relations: { submissionStatusUpdatedBy: true, modifier: true },
    where: {
      application: { id: applicationId },
    },
    order: { id: "ASC" },
    loadEagerRelations: false,
  });
  const auditUser = { id: auditUserId };
  expect(updatedFormSubmissions).toEqual(
    expectedFormSubmissionIds.map((id) => ({
      id,
      submissionStatus: FormSubmissionStatus.Cancelled,
      cancellationReason,
      submissionStatusUpdatedBy: auditUser,
      submissionStatusUpdatedOn: auditDate,
      modifier: auditUser,
      updatedAt: auditDate,
    })),
  );
}

/**
 * Verify if a form submission was not updated.
 * @param db E2EDataSources instance to access the database.
 * @param formSubmissionId form submission ID.
 * @param notExpectedCancellationReason cancellation reason that should not be set.
 * @param notExpectedSubmissionStatusDate submission status date that should not be set.
 */
export async function assertFormSubmissionNotUpdated(
  db: E2EDataSources,
  formSubmissionId: number,
  notExpectedCancellationReason: FormSubmissionCancellationReason,
  notExpectedSubmissionStatusDate: Date,
): Promise<void> {
  const formSubmission = await db.formSubmission.findOne({
    select: {
      id: true,
      submissionStatusUpdatedOn: true,
      cancellationReason: true,
    },
    where: { id: formSubmissionId },
  });
  expect(formSubmission.cancellationReason).not.toBe(
    notExpectedCancellationReason,
  );
  expect(formSubmission.submissionStatusUpdatedOn).not.toEqual(
    notExpectedSubmissionStatusDate,
  );
}
