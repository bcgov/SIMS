export interface StudentInfo {
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  dateOfBirth: Date;
  contact: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    provinceState: string;
    country: string;
    postalCode: string;
    phone: string;
  };
}
