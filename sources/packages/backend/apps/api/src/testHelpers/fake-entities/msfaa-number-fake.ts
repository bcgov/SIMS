import {
  MSFAANumber,
  OfferingIntensity,
  Student,
} from "../../database/entities";
import { createFakeStudent } from "./student-fake";
import * as faker from "faker";

export function createFakeMSFAANumber(student?: Student): MSFAANumber {
  const msfaaNumber = new MSFAANumber();
  msfaaNumber.student = student ?? createFakeStudent();
  msfaaNumber.msfaaNumber = faker.random
    .number({
      min: 1111111111,
      max: 9999999999,
    })
    .toString();
  msfaaNumber.offeringIntensity = OfferingIntensity.fullTime;
  return msfaaNumber;
}
