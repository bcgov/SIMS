import {
  DesignationAgreement,
  DesignationAgreementLocation,
  DesignationAgreementStatus,
  Institution,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import { INSTITUTION_TYPE_BC_PRIVATE } from "@sims/sims-db/constant";
import * as faker from "faker";
import { createFakeInstitution } from "./institution";

export function createFakeDesignationAgreement(
  fakeInstitution: Institution,
  fakeUser: User,
  fakeInstitutionLocations: InstitutionLocation[],
  designationStatus?: DesignationAgreementStatus,
): DesignationAgreement {
  const now = new Date();

  const fakeDesignationAgreement = new DesignationAgreement();
  fakeDesignationAgreement.institution =
    fakeInstitution ?? createFakeInstitution();
  const isBCPrivate =
    fakeInstitution.institutionType.id === INSTITUTION_TYPE_BC_PRIVATE;
  fakeDesignationAgreement.submittedData = {
    legalAuthorityName: faker.name.findName(),
    legalAuthorityEmailAddress: faker.internet.email(),
    scheduleA: isBCPrivate ? true : false,
    scheduleB: isBCPrivate ? true : false,
    scheduleD: isBCPrivate ? true : false,
    agreementAccepted: isBCPrivate ? true : false,
    enrolmentOfficers: [
      {
        name: isBCPrivate ? faker.name.findName() : "",
        email: isBCPrivate ? faker.internet.email() : "",
        phone: isBCPrivate ? faker.phone.phoneNumber("##########") : "",
        positionTitle: isBCPrivate ? faker.name.jobTitle() : "",
      },
    ],
    eligibilityOfficers: [
      {
        name: isBCPrivate ? faker.name.findName() : "",
        email: isBCPrivate ? faker.internet.email() : "",
        phone: isBCPrivate ? faker.phone.phoneNumber("##########") : "",
        positionTitle: isBCPrivate ? faker.name.jobTitle() : "",
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

  return fakeDesignationAgreement;
}
