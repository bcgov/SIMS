import { DisabilityStatus } from "@sims/sims-db";
import { IER12Student } from "./data-inputs.models";

export const JOHN_DOE_FROM_CANADA: IER12Student = {
  lastName: "Doe",
  firstName: "John",
  birthDate: new Date("1998-01-13"),
  sin: "242963189",
  addressInfo: {
    addressLine1: "Address Line 1",
    addressLine2: "Address Line 2",
    provinceState: "BC",
    city: "Victoria",
    postalCode: "Z1Z1Z1",
  },
  disabilityStatus: DisabilityStatus.NotRequested,
};

export const JANE_MONONYMOUS_FROM_OTHER_COUNTRY: IER12Student = {
  lastName: "Jane With Really Long Mononymous Name To Be Truncated",
  firstName: undefined,
  birthDate: new Date("1998-01-13"),
  sin: "242963189",
  addressInfo: {
    addressLine1: "Some Foreign Street Address Line 1",
    addressLine2: undefined,
    provinceState: undefined,
    city: "New York",
    postalCode: "SOME POSTAL CODE",
  },
  disabilityStatus: DisabilityStatus.NotRequested,
};
