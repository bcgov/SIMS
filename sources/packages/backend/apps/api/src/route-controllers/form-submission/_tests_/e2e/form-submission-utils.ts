import {
  FormSubmission,
  Notification,
  NotificationMessageType,
  StudentFile,
} from "@sims/sims-db";
import { E2EDataSources } from "@sims/test-utils";
import { IsNull } from "typeorm";

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
    order: { formSubmissionItems: { id: "ASC" } },
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
      templateId: true,
      recipients: true,
      messageContent: true,
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

/**
 * Get the entities related to a ministry form submission to assert the expected changes
 * in the database after a form submission is assessed by the ministry.
 * The form submission and the notification are common entities to be asserted in all the
 * Ministry form submission tests.
 * @param db data sources to retrieve the entities from the database.
 * @param formSubmissionId form submission ID to retrieve the updated form submission with its items and related entities.
 * @param studentUserId student user ID to retrieve the notification created for the ministry decision.
 * @returns array containing the updated form submission and the notification for assertion.
 */
export async function getEntitiesForMinistryCompleteFormSubmissionAssertion(
  db: E2EDataSources,
  formSubmissionId: number,
  studentUserId: number,
): Promise<[FormSubmission, Notification]> {
  const updatedFormSubmissionPromise = db.formSubmission.findOne({
    select: {
      id: true,
      submissionStatus: true,
      assessedDate: true,
      assessedBy: { id: true },
      modifier: { id: true },
      updatedAt: true,
      student: { id: true, notes: { id: true } },
    },
    relations: {
      assessedBy: true,
      modifier: true,
      student: { notes: true },
    },
    where: { id: formSubmissionId },
    order: { student: { notes: { id: "ASC" } } },
    loadEagerRelations: false,
  });
  const notificationPromise = db.notification.findOne({
    select: {
      id: true,
      notificationMessage: { id: true },
      messagePayload: true,
      templateId: true,
      recipients: true,
      messageContent: true,
      creator: { id: true },
    },
    relations: { notificationMessage: true, creator: true },
    where: {
      dateSent: IsNull(),
      user: { id: studentUserId },
    },
    loadEagerRelations: false,
  });
  return Promise.all([updatedFormSubmissionPromise, notificationPromise]);
}
