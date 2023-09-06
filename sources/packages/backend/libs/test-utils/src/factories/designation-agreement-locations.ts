import { DesignationAgreementLocation } from "@sims/sims-db";
import { E2EDataSources } from "../data-source/e2e-data-source";
import { createFakeDesignationAgreement } from "./designation-agreement";
import { createFakeInstitution } from "./institution";
import { createMultipleFakeInstitutionLocations } from "./institution-location";
import { createFakeUser } from "@sims/test-utils";

/**
 * Create and save fake designation agreement location/s.
 * @param db e2e data sources.
 * @param options options,
 * - `numberOfLocations` number of locations.
 * @returns created and saved fake designation agreement location/s.
 * */
export async function saveFakeDesignationAgreementLocation(
  db: E2EDataSources,
  options: {
    numberOfLocations: number;
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
  const designationAgreement = await db.designationAgreement.save(
    createFakeDesignationAgreement({
      fakeInstitution,
      fakeInstitutionLocations,
      fakeUser,
    }),
  );

  const designationAgreementLocations = fakeInstitutionLocations.map(
    (fakeInstitutionLocation) => {
      const designationAgreementLocation = new DesignationAgreementLocation();
      designationAgreementLocation.designationAgreement = designationAgreement;
      designationAgreementLocation.institutionLocation =
        fakeInstitutionLocation;
      designationAgreementLocation.requested = true;
      designationAgreementLocation.approved = true;
      return designationAgreementLocation;
    },
  );
  return db.designationAgreementLocation.save(designationAgreementLocations);
}
