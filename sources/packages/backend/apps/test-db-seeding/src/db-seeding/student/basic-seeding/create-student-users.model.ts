import * as faker from "faker";

export interface FakeStudent {
  username: string;
  options?: {
    sin?: string;
    isValidSIN?: boolean;
    sinConsent?: boolean;
    birthDate?: string;
    gender?: string;
  };
}

export const STUDENTS_INITIAL_DATA = [
  {
    username: process.env.E2E_TEST_STUDENT_USERNAME,
    options: {
      sin: "706941291",
      isValidSIN: true,
      sinConsent: true,
      birthDate: faker.date.past(18).toISOString(),
      gender: "F",
    },
  },
];
