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

export async function saveMSFAATestInputData(
  db: E2EDataSources,
  msfaa: MSFAATestInputData,
): Promise<MSFAANumber> {
  // User.
  const fakeUser = createFakeUser();
  fakeUser.firstName = msfaa.givenName;
  fakeUser.lastName = msfaa.surname;
  fakeUser.email = msfaa.email;
  // Student.
  const fakeStudent = createFakeStudent(fakeUser);
  fakeStudent.birthDate = msfaa.birthDate;
  fakeStudent.gender = msfaa.gender;
  fakeStudent.contactInfo = {
    address: {
      addressLine1: msfaa.addressLine1,
      addressLine2: msfaa.addressLine2,
      city: msfaa.city,
      country: msfaa.country,
      selectedCountry: msfaa.country,
      provinceState: msfaa.provinceState,
      postalCode: msfaa.postalCode,
    },
    phone: msfaa.phone,
  };
  // SIN validation.
  const sinValidation = createFakeSINValidation({ student: fakeStudent });
  sinValidation.sin = msfaa.sin;
  // Student.
  const student = await saveFakeStudent(db.dataSource, {
    student: fakeStudent,
    sinValidation,
  });
  // Application, offering, location.
  const referenceApplication = await saveFakeApplication(db.dataSource, {});
  referenceApplication.relationshipStatus = msfaa.maritalStatus;
  await db.application.save(referenceApplication);
  const offering = referenceApplication.currentAssessment.offering;
  offering.offeringIntensity = msfaa.offeringIntensity;
  await db.educationProgramOffering.save(offering);
  offering.institutionLocation.institutionCode = msfaa.institutionCode;
  await db.institutionLocation.save(offering.institutionLocation);
  // MSFAA.
  const newMSFAANumber = createFakeMSFAANumber({
    student,
    referenceApplication,
  });
  newMSFAANumber.msfaaNumber = msfaa.msfaaNumber;
  newMSFAANumber.dateRequested = null;
  newMSFAANumber.dateSigned = null;
  newMSFAANumber.serviceProviderReceivedDate = null;
  newMSFAANumber.cancelledDate = null;
  newMSFAANumber.newIssuingProvince = null;
  return db.msfaaNumber.save(newMSFAANumber);
}

export async function saveMSFAATestInputsData(
  db: E2EDataSources,
  ...msfaas: MSFAATestInputData[]
): Promise<MSFAANumber[]> {
  const saveMSFAAPromises = msfaas.map((msfaa) =>
    saveMSFAATestInputData(db, msfaa),
  );
  return Promise.all(saveMSFAAPromises);
}
