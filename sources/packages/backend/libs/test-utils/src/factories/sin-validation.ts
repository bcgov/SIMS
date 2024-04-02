import { SINValidation, Student } from "@sims/sims-db";
import * as faker from "faker";

/**
 * Creates a fake SINValidation.
 * @param relations SINValidation relations.
 * `student` related student.
 * @param options SINValidation options.
 * `initialValue` SINValidation initial value.
 * @returns persisted SINValidation with relations provided.
 */
export function createFakeSINValidation(
  relations?: {
    student?: Student;
  },
  options?: { initialValue?: Partial<SINValidation> },
): SINValidation {
  const now = new Date();
  const sinValidation = new SINValidation();
  // Generated an invalid SIN and avoiding a number starting with 9
  // to the SIN be considered not temporary by default.
  sinValidation.sin = faker.datatype
    .number({ min: 100000000, max: 899999999 })
    .toString();
  sinValidation.dateSent = now;
  sinValidation.dateReceived = now;
  sinValidation.fileSent = null;
  sinValidation.fileReceived = null;
  sinValidation.givenNameSent = null;
  sinValidation.surnameSent = null;
  sinValidation.dobSent = null;
  sinValidation.genderSent = null;
  sinValidation.isValidSIN = options?.initialValue?.isValidSIN ?? true;
  sinValidation.sinStatus = "1";
  sinValidation.validSINCheck = "Y";
  sinValidation.validBirthdateCheck = "Y";
  sinValidation.validFirstNameCheck = "Y";
  sinValidation.validLastNameCheck = "Y";
  sinValidation.validGenderCheck = "Y";
  sinValidation.sinExpiryDate = null;
  sinValidation.student = relations?.student;
  sinValidation.sinEditedBy = null;
  sinValidation.sinEditedDate = null;
  sinValidation.sinEditedNote = null;
  sinValidation.expiryDateEditedBy = null;
  sinValidation.expiryDateEditedDate = null;
  sinValidation.expiryDateEditedNote = null;
  return sinValidation;
}
