import * as faker from "faker";
import { SINValidation, Student, User } from "@sims/sims-db";
import { createFakeUser } from "@sims/test-utils";
import { DataSource } from "typeorm";
import { createFakeSINValidation } from "./sin-validation";
// TODO: the parameter user must be moved to relations and all the references must be
// updated.
export function createFakeStudent(user?: User): Student {
  const student = new Student();
  student.user = user ?? createFakeUser();
  student.birthDate = faker.date.past(18).toISOString();
  student.gender = "X";
  student.contactInfo = {
    address: {
      addressLine1: faker.address.streetAddress(),
      city: faker.address.city(),
      country: "canada",
      selectedCountry: "Canada",
      provinceState: "BC",
      postalCode: faker.address.zipCode(),
    },
    phone: faker.phone.phoneNumber(),
  };
  student.sinConsent = true;
  return student;
}

/**
 * Create and save fake student
 * @param dataSource data source to persist student.
 * @param relations student entity relations.
 * @returns persisted student with relations provided.
 */
export async function saveFakeStudent(
  dataSource: DataSource,
  relations?: { user?: User; sinValidation?: SINValidation },
): Promise<Student> {
  const studentRepo = dataSource.getRepository(Student);
  const student = await studentRepo.save(createFakeStudent(relations?.user));
  // Saving SIN validation after student is saved due to cyclic dependency error.
  student.sinValidation =
    relations?.sinValidation ?? createFakeSINValidation({ student });
  return studentRepo.save(student);
}
