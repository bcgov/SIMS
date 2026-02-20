import {
  InstitutionClassification,
  InstitutionOrganizationStatus,
  InstitutionMedicalSchoolStatus,
} from "@sims/sims-db";
import { CANADA_COUNTRY_CODE, BC_PROVINCE_CODE } from "@sims/sims-db/constant";
import { InstitutionProfileAPIInDTO } from "apps/api/src/route-controllers/institution/models/institution.dto";

/**
 * Get the institution profile payload.
 * @returns institution profile payload.
 */
export function getInstitutionProfilePayload(): InstitutionProfileAPIInDTO {
  return {
    operatingName: "Updated Institution operating name",
    regulatingBody: "icbc",
    establishedDate: "2023-06-01",
    primaryEmail: "test@test.ca",
    primaryPhone: "7785367878",
    website: "https://www.test.ca",
    country: CANADA_COUNTRY_CODE,
    province: BC_PROVINCE_CODE,
    classification: InstitutionClassification.Public,
    organizationStatus: InstitutionOrganizationStatus.Profit,
    medicalSchoolStatus: InstitutionMedicalSchoolStatus.No,
    primaryContactFirstName: "Primary",
    primaryContactLastName: "Contact",
    primaryContactEmail: "test@test.ca",
    primaryContactPhone: "7785367878",
    mailingAddress: {
      addressLine1: "123 Gorge Rd E",
      addressLine2: "",
      selectedCountry: "Canada",
      country: "Canada",
      city: "Victoria",
      postalCode: "V1V1V1",
      provinceState: "BC",
      canadaPostalCode: "V1V1V1",
    },
  };
}
