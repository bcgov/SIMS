import {
  CASSupplier,
  Student,
  SupplierAddress,
  SupplierStatus,
  User,
} from "@sims/sims-db";
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
 * @param options optional params.
 * - `supplierStatus` supplier status.
 * - `isValid` valid flag.
 * - `supplierAddress` supplier address.
 * - `supplierNumber` supplier number.
 * - `supplierProtected` supplier protected.
 * @returns a saved fake CAS supplier.
 */
export async function saveFakeCASSupplier(
  db: E2EDataSources,
  relations?: {
    student?: Student;
  },
  options?: {
    supplierStatus?: SupplierStatus;
    isValid?: boolean;
    supplierAddress?: SupplierAddress;
    supplierNumber?: string;
    supplierProtected?: boolean;
  },
): Promise<CASSupplier> {
  const auditUser = await db.user.save(createFakeUser());
  let student: Student;
  if (relations?.student) {
    student = relations.student;
  } else {
    student = await saveFakeStudent(db.dataSource);
  }
  const casSupplier = createFakeCASSupplier({ student, auditUser }, options);
  return db.casSupplier.save(casSupplier);
}

/**
 * Creates a fake CAS supplier.
 * @param relations dependencies.
 * - `student` related student.
 * - `auditUser` audit user for the record.
 * @param options optional params.
 * - `supplierStatus` supplier status.
 * - `isValid` valid flag.
 * - `supplierAddress` supplier address.
 * - `supplierNumber` supplier number.
 * - `supplierProtected` supplier protected.
 * @returns a fake CAS supplier.
 */
export function createFakeCASSupplier(
  relations: {
    student: Student;
    auditUser: User;
  },
  options?: {
    supplierStatus?: SupplierStatus;
    isValid?: boolean;
    supplierAddress?: SupplierAddress;
    supplierNumber?: string;
    supplierProtected?: boolean;
  },
): CASSupplier {
  const casSupplier = new CASSupplier();
  casSupplier.supplierStatus =
    options?.supplierStatus ?? SupplierStatus.PendingSupplierVerification;
  casSupplier.supplierStatusUpdatedOn = new Date();
  casSupplier.isValid = options?.isValid ?? false;
  casSupplier.supplierAddress = options?.supplierAddress;
  casSupplier.supplierNumber = options?.supplierNumber;
  casSupplier.supplierProtected = options?.supplierProtected;
  casSupplier.creator = relations.auditUser;
  casSupplier.student = relations.student;
  return casSupplier;
}
