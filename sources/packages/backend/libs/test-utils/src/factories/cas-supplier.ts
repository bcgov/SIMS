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
import * as faker from "faker";

/**
 * Saves a fake CAS supplier.
 * @param db manages the repositories to save the data.
 * @param relations dependencies:
 * - `student` student for the CAS supplier record.
 * @param options optional params.
 * - `supplierStatus` supplier status.
 * @returns a saved fake CAS supplier.
 */
export async function saveFakeCASSupplier(
  db: E2EDataSources,
  relations?: {
    student?: Student;
  },
  options?: {
    supplierStatus: SupplierStatus;
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
 * @returns a fake CAS supplier.
 */
export function createFakeCASSupplier(
  relations: {
    student: Student;
    auditUser: User;
  },
  options?: {
    supplierStatus: SupplierStatus;
  },
): CASSupplier {
  const casSupplier = new CASSupplier();
  casSupplier.supplierStatus =
    options?.supplierStatus ?? SupplierStatus.PendingSupplierVerification;

  // Verified manually has a minimum of values populated.
  if (options?.supplierStatus === SupplierStatus.VerifiedManually) {
    casSupplier.supplierAddress = {} as SupplierAddress;
    casSupplier.isValid = true;
  } else {
    casSupplier.supplierAddress = {
      supplierSiteCode: faker.datatype.number(999).toString(),
      addressLine1: faker.address.streetAddress(),
      addressLine2: faker.address.streetAddress(),
      city: faker.address.city(),
      provinceState: faker.address.state(),
      country: faker.address.country(),
      postalCode: faker.address.zipCode(),
      status: "ACTIVE",
      siteProtected: "YES",
      lastUpdated: new Date(),
    };
    casSupplier.supplierProtected = true;
    casSupplier.isValid = false;
  }
  casSupplier.supplierNumber = faker.datatype
    .number({ min: 1, max: 30 })
    .toString();
  casSupplier.supplierAddress.supplierSiteCode = faker.datatype
    .number({ min: 1, max: 3 })
    .toString();
  casSupplier.supplierStatusUpdatedOn = new Date();
  casSupplier.creator = relations.auditUser;
  casSupplier.student = relations.student;

  return casSupplier;
}
