import {
  BatchRestriction,
  BatchRestrictionStudent,
  StudentRestriction,
  User,
} from "@sims/sims-db";

/**
 * Creates a fake batch restriction student for a batch restriction.
 * @param relations required and optional relations for the batch restriction student.
 * - `batchRestriction` batch that includes the application number.
 * - `applicationNumber` application number submitted for the batch.
 * - `studentRestriction` active student restriction of the student of the application number, when available.
 * - `creator` user that created the batch restriction student.
 * @param options initial values for the batch restriction student.
 * - `initialValues` values that override the default values.
 * @returns a new batch restriction student to be saved to the database.
 */
export function createFakeBatchRestrictionStudent(
  relations: {
    batchRestriction: BatchRestriction;
    applicationNumber: string;
    studentRestriction?: StudentRestriction;
    creator?: User;
  },
  options?: {
    initialValues?: Partial<BatchRestrictionStudent>;
  },
): BatchRestrictionStudent {
  const batchRestrictionStudent = new BatchRestrictionStudent();
  batchRestrictionStudent.batchRestriction = relations.batchRestriction;
  batchRestrictionStudent.applicationNumber = relations.applicationNumber;
  batchRestrictionStudent.studentRestriction = relations.studentRestriction;
  batchRestrictionStudent.creator = relations.creator;
  batchRestrictionStudent.failureReason = options?.initialValues?.failureReason;
  return batchRestrictionStudent;
}
