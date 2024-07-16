import { CASSupplier, Student, SupplierStatus, User } from "@sims/sims-db";
import { E2EDataSources } from "@sims/test-utils";

export async function saveFakeCASSupplier(
  db: E2EDataSources,
  auditUser: User,
  student: Student,
) {
  const casSupplier = new CASSupplier();
  casSupplier.supplierStatus = SupplierStatus.PendingSupplierVerification;
  casSupplier.supplierStatusUpdatedOn = new Date();
  casSupplier.isValid = false;
  casSupplier.creator = auditUser;
  casSupplier.student = student;
  return db.casSupplier.save(casSupplier);
}
