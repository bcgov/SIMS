import { faker } from "@faker-js/faker";
import {
  CASSupplier,
  DisabilityStatus,
  SINValidation,
  Student,
  User,
} from "@sims/sims-db";
import { createFakeUser } from "@sims/test-utils";
import { DataSource } from "typeorm";
import { createFakeSINValidation } from "./sin-validation";
import { COUNTRY_CANADA, getISODateOnlyString } from "@sims/utilities";

// TODO: the parameter user must be moved to relations and all the references must be
// updated.
export function createFakeStudent(
  user?: User,
  relations?: { casSupplier?: CASSupplier },
  options?: { initialValue: Partial<Student>; includeAddressLine2?: boolean },
): Student {
  const student = new Student();
  student.user = user ?? createFakeUser();
  student.casSupplier = relations?.casSupplier;
  student.birthDate =
    options?.initialValue?.birthDate ??
    getISODateOnlyString(faker.date.past({ years: 99 }));
  student.gender = options?.initialValue?.gender ?? "nonBinary";
  student.contactInfo = options?.initialValue?.contactInfo ?? {
    address: {
      addressLine1: faker.location.streetAddress(),
      city: faker.location.city(),
      country: "Canada",
      selectedCountry: COUNTRY_CANADA,
      provinceState: "BC",
      postalCode: faker.location.zipCode(),
    },
    phone: faker.phone.number({ style: "national" }),
  };
  if (options?.includeAddressLine2) {
    student.contactInfo.address.addressLine2 =
      faker.location.secondaryAddress();
  }
  student.sinConsent = true;
  student.disabilityStatus =
    options?.initialValue?.disabilityStatus ?? DisabilityStatus.NotRequested;
  return student;
}

/**
 * Create and save fake student.
 * @param dataSource data source to persist student.
 * @param relations student entity relations.
 * - `user` related user.
 * - `student` student to be created an associated with other relations.
 * - `sinValidation` related SIN validation.
 * - `casSupplier` related CAS supplier.
 * @param options student options.
 * - `initialValue` student initial values.
 * - `sinValidationInitialValue` sinValidation initial value.
 * - `includeAddressLine2` include address line 2.
 * @returns persisted student with relations provided.
 */
export async function saveFakeStudent(
  dataSource: DataSource,
  relations?: {
    student?: Student;
    user?: User;
    sinValidation?: SINValidation;
    casSupplier?: CASSupplier;
  },
  options?: {
    initialValue?: Partial<Student>;
    sinValidationInitialValue?: Partial<SINValidation>;
    includeAddressLine2?: boolean;
  },
): Promise<Student> {
  const studentRepo = dataSource.getRepository(Student);
  const student = await studentRepo.save(
    relations?.student ??
      createFakeStudent(
        relations?.user,
        { casSupplier: relations?.casSupplier },
        {
          initialValue: options?.initialValue,
          includeAddressLine2: options?.includeAddressLine2,
        },
      ),
  );
  // Saving SIN validation after student is saved due to cyclic dependency error.
  student.sinValidation =
    relations?.sinValidation ??
    createFakeSINValidation(
      { student },
      { initialValue: options?.sinValidationInitialValue },
    );
  return studentRepo.save(student);
}
