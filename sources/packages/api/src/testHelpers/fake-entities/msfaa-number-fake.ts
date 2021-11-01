import { MSFAANumber, Student, Application } from "../../database/entities";
import { createFakeStudent } from "./student-fake";
import * as faker from "faker";

export function createFakeMSFAANumber(
  referenceApplication: Application,
  student?: Student,
): MSFAANumber {
  const msfaaNumber = new MSFAANumber();
  msfaaNumber.student = student ?? createFakeStudent();
  msfaaNumber.referenceApplication = referenceApplication;
  msfaaNumber.msfaaNumber = faker.random
    .number({
      min: 1111111111,
      max: 9999999999,
    })
    .toString();
  return msfaaNumber;
}
