import { CASSupplier, Student, SupplierStatus, User } from "@sims/sims-db";
import {
  createFakeUser,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";

/**
 * Saves a fake CAS supplier.
 * @param db manages the repositories to save the data.
 * @param relations dependencies:
 * - `student` student for the CAS supplier record.
 * @returns a saved fake CAS supplier.
 */
export async function saveFakeCASSupplier(
  db: E2EDataSources,
  relations?: {
    student?: Student;
  },
): Promise<CASSupplier> {
  const auditUser = await db.user.save(createFakeUser());
  let student;
  if (relations?.student) {
    student = relations.student;
  } else {
    student = await saveFakeStudent(db.dataSource);
  }
  const casSupplier = createFakeCASSupplier({ student, auditUser });
  return db.casSupplier.save(casSupplier);
}

/**
 * Creates a fake CAS supplier.
 * @param relations dependencies.
 * - `student` related student.
 * - `auditUser` audit user for the record.
 * @returns a fake CAS supplier.
 */
export function createFakeCASSupplier(relations: {
  student: Student;
  auditUser: User;
}) {
  const casSupplier = new CASSupplier();
  casSupplier.supplierStatus = SupplierStatus.PendingSupplierVerification;
  casSupplier.supplierStatusUpdatedOn = new Date();
  casSupplier.isValid = false;
  casSupplier.creator = relations.auditUser;
  casSupplier.student = relations.student;
  return casSupplier;
}
