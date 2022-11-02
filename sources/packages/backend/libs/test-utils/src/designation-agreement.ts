import {
  DesignationAgreement,
  DesignationAgreementLocation,
  DesignationAgreementStatus,
  Institution,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import * as dayjs from "dayjs";
import * as faker from "faker";

export function createFakeDesignationAgreement(
  fakeInstitution: Institution,
  fakeUser: User,
  fakeInstitutionLocations: InstitutionLocation[],
  designationStatus?: DesignationAgreementStatus,
): DesignationAgreement {
  const now = new Date();

  const fakeDesignationAgreement = new DesignationAgreement();
  fakeDesignationAgreement.institution = {
    id: fakeInstitution.id,
  } as Institution;
  fakeDesignationAgreement.submittedData = {
    legalAuthorityName: faker.name.findName(),
    legalAuthorityEmailAddress: faker.internet.email(),
    scheduleA: true,
    scheduleB: true,
    scheduleD: true,
    agreementAccepted: true,
    enrolmentOfficers: [
      {
        name: faker.name.findName(),
        email: faker.internet.email(),
        phone: faker.phone.phoneNumberFormat(),
        positionTitle: faker.name.jobTitle(),
      },
    ],
    eligibilityOfficers: [
      {
        name: faker.name.findName(),
        email: faker.internet.email(),
        phone: faker.phone.phoneNumberFormat(),
        positionTitle: faker.name.jobTitle(),
      },
    ],
  };
  fakeDesignationAgreement.designationStatus =
    designationStatus ?? DesignationAgreementStatus.Pending;
  fakeDesignationAgreement.submittedBy = fakeUser;
  fakeDesignationAgreement.submittedDate = now;
  fakeDesignationAgreement.creator = fakeUser;
  fakeDesignationAgreement.createdAt = now;
  fakeDesignationAgreement.designationAgreementLocations =
    fakeInstitutionLocations.map((location: InstitutionLocation) => {
      const newLocation = new DesignationAgreementLocation();
      newLocation.institutionLocation = location;
      newLocation.requested = true;
      newLocation.creator = fakeUser;
      newLocation.createdAt = now;
      return newLocation;
    });
  if (designationStatus === DesignationAgreementStatus.Approved) {
    fakeDesignationAgreement.startDate = now;
    fakeDesignationAgreement.endDate = dayjs().add(1, "year").toDate();
    // save note
  }
  return fakeDesignationAgreement;
}
