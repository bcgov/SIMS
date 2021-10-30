import * as faker from "faker";
import { Student, User } from "../../database/entities";
import { createFakeUser } from "./user-fake";

export function createFakeStudent(user?: User): Student {
  const student = new Student();
  student.user = user ?? createFakeUser();
  student.sin = faker.random
    .number({ min: 100000000, max: 999999999 })
    .toString();
  student.birthdate = faker.date.past(18).toString();
  student.gender = "X";
  student.contactInfo = {
    addresses: [
      {
        addressLine1: faker.address.streetAddress(),
        city: faker.address.city(),
        country: "CAN",
        province: "BC",
        postalCode: faker.address.zipCode(),
      },
    ],
    phone: faker.phone.phoneNumber(),
  };
  return student;
}
