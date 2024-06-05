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
 * Creates and saves fake designation agreement with location/s.
 * @param db e2e data sources.
 * @param options related options.
 * - `numberOfLocations` number of locations.
 * - `initialValues` designation agreement initial values.
 * @returns designation agreement with the created locations associated.
 * */
export async function saveFakeDesignationAgreementLocation(
  db: E2EDataSources,
  options: {
    numberOfLocations: number;
    initialValues?: Partial<DesignationAgreement>;
  },
): Promise<DesignationAgreement> {
  const fakeInstitution = await db.institution.save(createFakeInstitution());
  // Create fake institution locations.
  const fakeInstitutionLocations = await db.institutionLocation.save(
    createMultipleFakeInstitutionLocations(
      fakeInstitution,
      options.numberOfLocations,
    ),
  );
  const fakeUser = await db.user.save(createFakeUser());
  return db.designationAgreement.save(
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
}
