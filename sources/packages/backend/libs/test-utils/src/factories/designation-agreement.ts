import {
  DesignationAgreement,
  DesignationAgreementLocation,
  DesignationAgreementStatus,
  Institution,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import { INSTITUTION_TYPE_BC_PRIVATE } from "@sims/sims-db/constant";
import { addDays, formatDate } from "@sims/utilities";
import * as faker from "faker";

/**
 * Create a fake designation agreement.
 * @param relations relations,
 * - `fakeInstitution` fake institution.
 * - `fakeInstitutionLocations` fake institution location/s.
 * - `fakeUser` fake user
 * @param options options,
 * - `designationStatus` designation status, by default
 * it is approved.
 * @returns fake designation agreement.
 * */
export function createFakeDesignationAgreement(
  relations: {
    fakeInstitution: Institution;
    fakeInstitutionLocations: InstitutionLocation[];
    fakeUser: User;
  },
  options?: {
    initialValue?: Partial<DesignationAgreement>;
  },
): DesignationAgreement {
  const now = new Date();
  const status = options?.initialValue?.designationStatus
    ? options.initialValue.designationStatus
    : DesignationAgreementStatus.Approved;
  const fakeDesignationAgreement = new DesignationAgreement();
  fakeDesignationAgreement.institution = relations.fakeInstitution;
  const isBCPrivate =
    fakeDesignationAgreement.institution.institutionType.id ===
    INSTITUTION_TYPE_BC_PRIVATE;
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
  const newFakeUser = relations.fakeUser;
  const newFakeInstitutionLocations = relations.fakeInstitutionLocations;
  fakeDesignationAgreement.designationStatus = status;
  fakeDesignationAgreement.submittedBy = newFakeUser;
  fakeDesignationAgreement.submittedDate = now;
  fakeDesignationAgreement.creator = newFakeUser;
  fakeDesignationAgreement.createdAt = now;
  fakeDesignationAgreement.startDate = formatDate(
    addDays(-10, new Date()),
    "YYYYMMDD",
  );
  fakeDesignationAgreement.endDate =
    options?.initialValue?.endDate ??
    formatDate(addDays(90, new Date()), "YYYYMMDD");
  fakeDesignationAgreement.designationAgreementLocations =
    newFakeInstitutionLocations.map((location: InstitutionLocation) => {
      const newLocation = new DesignationAgreementLocation();
      newLocation.institutionLocation = location;
      newLocation.requested = true;
      newLocation.creator = newFakeUser;
      newLocation.createdAt = now;
      return newLocation;
    });
  return fakeDesignationAgreement;
}
