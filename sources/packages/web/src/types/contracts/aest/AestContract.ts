export interface SearchStudentResp {
  id: number;
  firstName: string;
  lastName: string;
  birthDate: string;
}

export interface StudentDetail {
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
  pdVerified: boolean;
  validSin: boolean;
  pdStatus: string;
  applications: StudentApplicationSummary[];
}

export interface StudentApplicationSummary {
  applicationNumber: string;
  studyStartPeriod: string;
  studyEndPeriod: string;
  id: number;
  applicationName: string;
  award: string;
  status: string;
}
