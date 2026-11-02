import {
  BatchRestriction,
  BatchRestrictionStudent,
  Student,
  User,
} from "@sims/sims-db";

/**
 * Creates a fake batch restriction student for a batch restriction.
 * @param relations required and optional relations for the batch restriction student.
 * - `batchRestriction` batch that includes the student.
 * - `identifier` identifier submitted to find the student.
 * - `student` student found using the identifier, when available.
 * - `creator` user that created the batch restriction student.
 * @param options initial values for the batch restriction student.
 * - `initialValues` values that override the default values.
 * @returns a new batch restriction student to be saved to the database.
 */
export function createFakeBatchRestrictionStudent(
  relations: {
    batchRestriction: BatchRestriction;
    identifier: string;
    student?: Student;
    creator?: User;
  },
  options?: {
    initialValues?: Partial<BatchRestrictionStudent>;
  },
): BatchRestrictionStudent {
  const batchRestrictionStudent = new BatchRestrictionStudent();
  batchRestrictionStudent.batchRestriction = relations.batchRestriction;
  batchRestrictionStudent.identifier = relations.identifier;
  batchRestrictionStudent.student = relations.student;
  batchRestrictionStudent.creator = relations.creator;
  batchRestrictionStudent.failureReason = options?.initialValues?.failureReason;
  return batchRestrictionStudent;
}
