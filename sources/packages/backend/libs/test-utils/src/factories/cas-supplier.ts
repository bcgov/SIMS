import {
  CASSupplier,
  Student,
  StudentProfileSnapshot,
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
 * - `initialValues` CAS supplier initial values.
 * @returns a saved fake CAS supplier.
 */
export async function saveFakeCASSupplier(
  db: E2EDataSources,
  relations?: {
    student?: Student;
  },
  options?: {
    initialValues?: Partial<CASSupplier>;
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
  student.casSupplier = casSupplier;
  await db.student.save(student);
  return student.casSupplier;
}

/**
 * Creates a fake CAS supplier.
 * @param relations dependencies.
 * - `student` related student.
 * - `auditUser` audit user for the record.
 * @param options optional params.
 * - `initialValues` CAS supplier initial values.
 * @returns a fake CAS supplier.
 */
export function createFakeCASSupplier(
  relations: {
    student: Student;
    auditUser: User;
  },
  options?: {
    initialValues?: Partial<CASSupplier>;
  },
): CASSupplier {
  const casSupplier = new CASSupplier();
  casSupplier.supplierStatus =
    options?.initialValues?.supplierStatus ??
    SupplierStatus.PendingSupplierVerification;

  // Verified manually has a minimum of values populated.
  if (
    options?.initialValues?.supplierStatus === SupplierStatus.VerifiedManually
  ) {
    casSupplier.supplierAddress = {} as SupplierAddress;
    casSupplier.isValid = options?.initialValues.isValid ?? true;
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
  casSupplier.supplierName = `${faker.name.lastName()}, ${faker.name.firstName()}`;
  casSupplier.supplierNumber = faker.datatype
    .number({ min: 100000, max: 9999999999 })
    .toString();
  casSupplier.supplierAddress.supplierSiteCode = faker.datatype
    .number({ min: 100, max: 999 })
    .toString();
  casSupplier.supplierStatusUpdatedOn = new Date();
  casSupplier.creator = relations.auditUser;
  casSupplier.student = relations.student;
  // Build the student profile snapshot based on valid status.
  const studentProfileSnapshot: StudentProfileSnapshot = casSupplier.isValid
    ? {
        firstName: relations.student.user.firstName,
        lastName: relations.student.user.lastName,
        sin: relations.student.sinValidation.sin,
        addressLine1: relations.student.contactInfo.address.addressLine1,
        city: relations.student.contactInfo.address.city,
        province: relations.student.contactInfo.address.provinceState,
        postalCode: relations.student.contactInfo.address.postalCode,
        country: relations.student.contactInfo.address.country,
      }
    : null;
  casSupplier.studentProfileSnapshot =
    options?.initialValues?.studentProfileSnapshot ?? studentProfileSnapshot;

  return casSupplier;
}
