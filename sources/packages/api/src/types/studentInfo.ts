import { StudentContact } from "./studentContact";

export interface StudentInfo {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  dateOfBirth: Date;
  contact: StudentContact;
  // contact:  new (class contact {
  //   addressLine1: string;
  //   addressLine2: string;
  //   city: string;
  //   provinceState: string;
  //   country: string;
  //   postalCode: string;
  //   phone: string;
  // })();
}
