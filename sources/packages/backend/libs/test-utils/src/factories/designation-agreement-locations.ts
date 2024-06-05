import {
  DesignationAgreement,
  DesignationAgreementLocation,
} from "@sims/sims-db";
import { E2EDataSources } from "../data-source/e2e-data-source";
import { createFakeDesignationAgreement } from "./designation-agreement";
import { createFakeInstitution } from "./institution";
import { createMultipleFakeInstitutionLocations } from "./institution-location";
import { createFakeUser } from "@sims/test-utils";

/**
 * Creates and saves fake designation agreement location/s.
 * In case two or more locations are requested for designation,
 * this method approves the first location's designation request,
 * second location onwards are not approved for their designation request.
 * @param db e2e data sources.
 * @param options related options.
 * - `numberOfLocations` number of locations.
 * - `initialValues` designation agreement initial values.
 * @returns created and saved fake designation agreement location/s.
 * */
export async function saveFakeDesignationAgreementLocation(
  db: E2EDataSources,
  options: {
    numberOfLocations: number;
    initialValues?: Partial<DesignationAgreement>;
  },
): Promise<DesignationAgreementLocation[]> {
  const fakeInstitution = await db.institution.save(createFakeInstitution());
  // Create fake institution locations.
  const fakeInstitutionLocations = await db.institutionLocation.save(
    createMultipleFakeInstitutionLocations(
      fakeInstitution,
      options.numberOfLocations,
    ),
  );
  const fakeUser = await db.user.save(createFakeUser());
  const savedDesignationAgreement = await db.designationAgreement.save(
    createFakeDesignationAgreement(
      {
        fakeInstitution,
        fakeInstitutionLocations,
        fakeUser,
      },
      {
        initialValue: {
          endDate: options.initialValues?.endDate,
          assessedDate: options.initialValues?.assessedDate,
        },
        locationApprovedDesignationRequest: true,
      },
    ),
  );
  const savedDesignationAgreementLocations =
    savedDesignationAgreement.designationAgreementLocations;
  savedDesignationAgreementLocations.forEach(
    (savedDesignationAgreementLocation) =>
      (savedDesignationAgreementLocation.designationAgreement =
        savedDesignationAgreement),
  );
  return savedDesignationAgreementLocations;
}
