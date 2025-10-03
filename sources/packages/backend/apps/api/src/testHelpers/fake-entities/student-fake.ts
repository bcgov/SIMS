import { faker } from "@faker-js/faker";
import { Student, User } from "@sims/sims-db";
import { createFakeUser } from "@sims/test-utils";

/**
 * @deprecated use the factories from @sims/test-utils.
 */
export function createFakeStudent(user?: User): Student {
  const student = new Student();
  student.user = user ?? createFakeUser();
  student.birthDate = faker.date.past({ years: 99 }).toISOString();
  student.gender = "nonBinary";
  student.contactInfo = {
    address: {
      addressLine1: faker.location.streetAddress(),
      city: faker.location.city(),
      country: "CAN",
      provinceState: "BC",
      postalCode: faker.location.zipCode(),
    },
    phone: faker.phone.number({ style: "national" }),
  };
  return student;
}
