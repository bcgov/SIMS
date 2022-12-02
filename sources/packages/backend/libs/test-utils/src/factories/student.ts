import * as faker from "faker";
import { Student, User } from "@sims/sims-db";
import { createFakeUser } from "@sims/test-utils";

export function createFakeStudent(user?: User): Student {
  const student = new Student();
  student.user = user ?? createFakeUser();
  student.birthDate = faker.date.past(18).toISOString();
  student.gender = "X";
  student.contactInfo = {
    address: {
      addressLine1: faker.address.streetAddress(),
      city: faker.address.city(),
      country: "CAN",
      provinceState: "BC",
      postalCode: faker.address.zipCode(),
    },
    phone: faker.phone.phoneNumber(),
  };
  student.sinConsent = true;
  return student;
}
