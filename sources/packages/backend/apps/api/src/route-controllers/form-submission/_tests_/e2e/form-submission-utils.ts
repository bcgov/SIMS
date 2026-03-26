import { INestApplication } from "@nestjs/common";
import {
  DynamicFormConfiguration,
  FormCategory,
  FormSubmission,
  Notification,
  NotificationMessageType,
  StudentFile,
} from "@sims/sims-db";
import {
  E2EDataSources,
  ensureDynamicFormConfigurationExists,
} from "@sims/test-utils";
import { DynamicFormConfigurationService } from "../../../../services";
import { IsNull } from "typeorm";

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
 * Get the entities related to a student form submission to assert the expected changes
 * in the database after a form submission is created.
 * @param db data sources to retrieve the entities from the database.
 * @param createdSubmissionId form submission ID to retrieve the created form submission
 * with its items and related entities.
 * @param studentFileId student file ID to retrieve the updated student file with the expected association to the created form submission.
 * @returns the form submission with its items and related entities, the updated student file, and the notification created for the ministry.
 */
export function getEntitiesForStudentFormSubmissionAssertion(
  db: E2EDataSources,
  createdSubmissionId: number,
  studentFileId: number,
): Promise<[FormSubmission, StudentFile, Notification]> {
  const createdSubmissionPromise = db.formSubmission.findOne({
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
  const updatedStudentFilePromise = db.studentFile.findOne({
    select: { id: true, fileOrigin: true, modifier: { id: true } },
    relations: { modifier: true },
    where: { id: studentFileId },
  });
  const notificationPromise = db.notification.findOne({
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
  return Promise.all([
    createdSubmissionPromise,
    updatedStudentFilePromise,
    notificationPromise,
  ]);
}
