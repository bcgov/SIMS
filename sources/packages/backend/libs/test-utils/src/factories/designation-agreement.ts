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
import { createFakeInstitutionLocation } from "./institution-location";
import { createFakeUser } from "./user";

export function createFakeDesignationAgreement(
  fakeInstitution?: Institution,
  fakeUser?: User,
  fakeInstitutionLocations?: InstitutionLocation[],
  designationStatus = DesignationAgreementStatus.Approved,
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
  const newFakeUser = fakeUser ?? createFakeUser();
  const newFakeInstitutionLocation = fakeInstitutionLocations ?? [
    createFakeInstitutionLocation(),
  ];
  fakeDesignationAgreement.designationStatus = designationStatus;
  fakeDesignationAgreement.submittedBy = newFakeUser;
  fakeDesignationAgreement.submittedDate = now;
  fakeDesignationAgreement.creator = newFakeUser;
  fakeDesignationAgreement.createdAt = now;
  fakeDesignationAgreement.designationAgreementLocations =
    newFakeInstitutionLocation.map((location: InstitutionLocation) => {
      const newLocation = new DesignationAgreementLocation();
      newLocation.institutionLocation = location;
      newLocation.requested = true;
      newLocation.creator = newFakeUser;
      newLocation.createdAt = now;
      return newLocation;
    });

  return fakeDesignationAgreement;
}
