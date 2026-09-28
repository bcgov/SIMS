import {
  BatchReassessment,
  BatchReassessmentApplication,
  StudentAssessment,
  User,
} from "@sims/sims-db";

/**
 * Creates a fake batch reassessment application for a batch manual reassessment.
 * @param relations required and optional relations for the application.
 * - `batchReassessment` batch that includes the application.
 * - `applicationNumber` application number submitted for the batch.
 * - `studentAssessment` assessment created for the application, when available.
 * - `creator` user that created the application.
 * @param options initial values for the application.
 * - `initialValues` values that override the default values.
 * @returns a new batch reassessment application to be saved to the database.
 */
export function createFakeBatchReassessmentApplication(
  relations: {
    batchReassessment: BatchReassessment;
    applicationNumber: string;
    studentAssessment?: StudentAssessment;
    creator?: User;
  },
  options?: {
    initialValues?: Partial<BatchReassessmentApplication>;
  },
): BatchReassessmentApplication {
  const batchReassessmentApplication = new BatchReassessmentApplication();
  batchReassessmentApplication.batchReassessment = relations.batchReassessment;
  batchReassessmentApplication.applicationNumber = relations.applicationNumber;
  batchReassessmentApplication.studentAssessment = relations.studentAssessment;
  batchReassessmentApplication.creator = relations.creator;
  batchReassessmentApplication.failureReason =
    options?.initialValues?.failureReason;
  return batchReassessmentApplication;
}
