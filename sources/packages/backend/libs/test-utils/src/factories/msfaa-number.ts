import {
  Application,
  MSFAANumber,
  OfferingIntensity,
  Student,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

export function createFakeMSFAANumber(relations: {
  student: Student;
  referenceApplication?: Application;
}): MSFAANumber {
  const now = new Date();
  const dateOnly = getISODateOnlyString(now);
  const msfaaNumber = new MSFAANumber();
  msfaaNumber.msfaaNumber = faker.random
    .number({
      min: 1000000000,
      max: 9999999999,
    })
    .toString();
  msfaaNumber.dateRequested = now;
  msfaaNumber.dateSigned = dateOnly;
  msfaaNumber.serviceProviderReceivedDate = dateOnly;
  msfaaNumber.offeringIntensity = OfferingIntensity.fullTime;
  msfaaNumber.cancelledDate = null;
  msfaaNumber.newIssuingProvince = null;
  msfaaNumber.student = relations.student;
  msfaaNumber.referenceApplication = relations?.referenceApplication;
  return msfaaNumber;
}
