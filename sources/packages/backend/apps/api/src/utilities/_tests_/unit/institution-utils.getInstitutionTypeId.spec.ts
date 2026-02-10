import {
  InstitutionClassification,
  InstitutionMedicalSchoolStatus,
} from "@sims/sims-db";
import {
  BC_PROVINCE_CODE,
  CANADA_COUNTRY_CODE,
  UNITED_STATES_COUNTRY_CODE,
} from "@sims/sims-db/constant";
import {
  getInstitutionTypeId,
  InstitutionIdTypes,
} from "../../institution-utils";
import { ONTARIO_PROVINCE_CODE } from "@sims/test-utils/constants";

describe("InstitutionUtils-getInstitutionTypeId", () => {
  const testInputs = [
    {
      // BC Public.
      country: CANADA_COUNTRY_CODE,
      province: BC_PROVINCE_CODE,
      classification: InstitutionClassification.Public,
      medicalSchoolStatus: InstitutionMedicalSchoolStatus.No,
      expectedInstitutionTypeId: InstitutionIdTypes.BCPublic,
    },
    {
      // BC Private.
      country: CANADA_COUNTRY_CODE,
      province: BC_PROVINCE_CODE,
      classification: InstitutionClassification.Private,
      medicalSchoolStatus: InstitutionMedicalSchoolStatus.No,
      expectedInstitutionTypeId: InstitutionIdTypes.BCPrivate,
    },
    {
      // United States.
      country: UNITED_STATES_COUNTRY_CODE,
      province: undefined,
      classification: InstitutionClassification.Private,
      medicalSchoolStatus: InstitutionMedicalSchoolStatus.No,
      expectedInstitutionTypeId: InstitutionIdTypes.UnitedStates,
    },
    {
      // Out of province public.
      country: CANADA_COUNTRY_CODE,
      province: ONTARIO_PROVINCE_CODE,
      classification: InstitutionClassification.Public,
      medicalSchoolStatus: InstitutionMedicalSchoolStatus.No,
      expectedInstitutionTypeId: InstitutionIdTypes.OutOfProvincePublic,
    },
    {
      // Out of province private.
      country: CANADA_COUNTRY_CODE,
      province: ONTARIO_PROVINCE_CODE,
      classification: InstitutionClassification.Private,
      medicalSchoolStatus: InstitutionMedicalSchoolStatus.No,
      expectedInstitutionTypeId: InstitutionIdTypes.OutOfProvincePrivate,
    },
    {
      // International not United States and not a medical school.
      country: "FR",
      province: undefined,
      classification: InstitutionClassification.Private,
      medicalSchoolStatus: InstitutionMedicalSchoolStatus.No,
      expectedInstitutionTypeId: InstitutionIdTypes.International,
    },
    {
      // International not united states and also a medical school.
      country: "FR",
      province: undefined,
      classification: InstitutionClassification.Private,
      medicalSchoolStatus: InstitutionMedicalSchoolStatus.Yes,
      expectedInstitutionTypeId: InstitutionIdTypes.InternationalMedical,
    },
  ];
  for (const input of testInputs) {
    it(`Should return ${input.expectedInstitutionTypeId} when the country is ${input.country}, province is ${input.province ?? "not provided"}, classification is ${input.classification} and medical school status is ${input.medicalSchoolStatus}.`, () => {
      const result = getInstitutionTypeId(input);
      expect(result).toBe(input.expectedInstitutionTypeId);
    });
  }
});
