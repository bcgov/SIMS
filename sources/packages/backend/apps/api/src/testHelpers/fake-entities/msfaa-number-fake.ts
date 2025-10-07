import { MSFAANumber, OfferingIntensity, Student } from "@sims/sims-db";
import { createFakeStudent } from "./student-fake";
import { faker } from "@faker-js/faker";

export function createFakeMSFAANumber(student?: Student): MSFAANumber {
  const msfaaNumber = new MSFAANumber();
  msfaaNumber.student = student ?? createFakeStudent();
  msfaaNumber.msfaaNumber = faker.number
    .int({
      min: 1111111111,
      max: 9999999999,
    })
    .toString();
  msfaaNumber.offeringIntensity = OfferingIntensity.fullTime;
  return msfaaNumber;
}
