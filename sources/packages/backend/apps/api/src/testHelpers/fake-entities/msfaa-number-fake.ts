import { MSFAANumber, OfferingIntensity, Student } from "@sims/sims-db";
import { createFakeStudent } from "./student-fake";
import * as faker from "faker";

export function createFakeMSFAANumber(student?: Student): MSFAANumber {
  const msfaaNumber = new MSFAANumber();
  msfaaNumber.student = student ?? createFakeStudent();
  msfaaNumber.msfaaNumber = faker.datatype
    .number({
      min: 1111111111,
      max: 9999999999,
    })
    .toString();
  msfaaNumber.offeringIntensity = OfferingIntensity.fullTime;
  return msfaaNumber;
}
