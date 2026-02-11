import {
  Institution,
  InstitutionClassification,
  InstitutionMedicalSchoolStatus,
} from "@sims/sims-db";
import {
  CANADA_COUNTRY_CODE,
  BC_PROVINCE_CODE,
  UNITED_STATES_COUNTRY_CODE,
} from "@sims/sims-db/constant";

/**
 * Institution types.
 */
export enum InstitutionIdTypes {
  BCPublic = 1,
  BCPrivate = 2,
  OutOfProvincePublic = 3,
  UnitedStates = 4,
  International = 5,
  InternationalMedical = 6,
  OutOfProvincePrivate = 7,
}

/**
 * Get institution type id based on institution details.
 * @returns institution type.
 */
export function getInstitutionTypeId(
  institution: Pick<
    Institution,
    "country" | "province" | "classification" | "medicalSchoolStatus"
  >,
): number {
  // When country is Canada.
  if (institution.country === CANADA_COUNTRY_CODE) {
    const isPublic =
      institution.classification === InstitutionClassification.Public;
    if (institution.province === BC_PROVINCE_CODE) {
      return isPublic
        ? InstitutionIdTypes.BCPublic
        : InstitutionIdTypes.BCPrivate;
    }
    return isPublic
      ? InstitutionIdTypes.OutOfProvincePublic
      : InstitutionIdTypes.OutOfProvincePrivate;
  }
  // When country is United States.
  if (institution.country === UNITED_STATES_COUNTRY_CODE) {
    return InstitutionIdTypes.UnitedStates;
  }
  // Other international institutions.
  return institution.medicalSchoolStatus === InstitutionMedicalSchoolStatus.Yes
    ? InstitutionIdTypes.InternationalMedical
    : InstitutionIdTypes.International;
}
