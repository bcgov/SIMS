import { MSFAANumber } from "@sims/sims-db";
import {
  E2EDataSources,
  createFakeMSFAANumber,
  createFakeStudent,
  createFakeUser,
  saveFakeApplication,
  saveFakeStudent,
} from "@sims/test-utils";
import { MSFAATestInputData } from "./msfaa-part-time-process-integration.scheduler.models";
import { createFakeSINValidation } from "@sims/test-utils/factories/sin-validation";

/**
 * Save an MSFAA record providing all data that will be
 * part of the MSFAA file generation.
 * @param db data source helper.
 * @param msfaa test input data.
 * @returns a saved MSFAA record that uses the input test
 * data to be created.
 */
export async function saveMSFAATestInputData(
  db: E2EDataSources,
  msfaaDataInput: MSFAATestInputData,
): Promise<MSFAANumber> {
  // User.
  const fakeUser = createFakeUser();
  fakeUser.firstName = msfaaDataInput.givenName;
  fakeUser.lastName = msfaaDataInput.surname;
  fakeUser.email = msfaaDataInput.email;
  // Student.
  const fakeStudent = createFakeStudent(fakeUser);
  fakeStudent.birthDate = msfaaDataInput.birthDate;
  fakeStudent.gender = msfaaDataInput.gender;
  fakeStudent.contactInfo = {
    address: {
      addressLine1: msfaaDataInput.addressLine1,
      addressLine2: msfaaDataInput.addressLine2,
      city: msfaaDataInput.city,
      country: msfaaDataInput.country,
      selectedCountry: msfaaDataInput.country,
      provinceState: msfaaDataInput.provinceState,
      postalCode: msfaaDataInput.postalCode,
    },
    phone: msfaaDataInput.phone,
  };
  // SIN validation.
  const sinValidation = createFakeSINValidation({ student: fakeStudent });
  sinValidation.sin = msfaaDataInput.sin;
  // Student.
  const student = await saveFakeStudent(db.dataSource, {
    student: fakeStudent,
    sinValidation,
  });
  // Application, offering, location.
  const referenceApplication = await saveFakeApplication(db.dataSource);
  referenceApplication.relationshipStatus = msfaaDataInput.maritalStatus;
  await db.application.save(referenceApplication);
  const offering = referenceApplication.currentAssessment.offering;
  offering.offeringIntensity = msfaaDataInput.offeringIntensity;
  await db.educationProgramOffering.save(offering);
  offering.institutionLocation.institutionCode = msfaaDataInput.institutionCode;
  await db.institutionLocation.save(offering.institutionLocation);
  // MSFAA.
  const newMSFAANumber = createFakeMSFAANumber({
    student,
    referenceApplication,
  });
  newMSFAANumber.msfaaNumber = msfaaDataInput.msfaaNumber;
  return db.msfaaNumber.save(newMSFAANumber);
}

/**
 * Saves a list of MSFAA test records.
 * @param db data source helper.
 * @param msfaaDataInputs input data for the MSFAA records to be created.
 * @returns all MSFAA records created. The result order may differ
 * from the array input order.
 */
export async function saveMSFAATestInputsData(
  db: E2EDataSources,
  msfaaDataInputs: MSFAATestInputData[],
): Promise<MSFAANumber[]> {
  const saveMSFAAPromises = msfaaDataInputs.map((msfaa) =>
    saveMSFAATestInputData(db, msfaa),
  );
  return Promise.all(saveMSFAAPromises);
}
