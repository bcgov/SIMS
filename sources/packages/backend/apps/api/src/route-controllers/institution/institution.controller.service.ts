import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InstitutionService, InstitutionTypeService } from "../../services";
import { AddressInfo, SystemLookupCategory } from "@sims/sims-db";
import {
  InstitutionDetailAPIOutDTO,
  InstitutionProfileAPIInDTO,
} from "./models/institution.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import {
  INSTITUTION_TYPE_BC_PRIVATE,
  INSTITUTION_TYPE_BC_PUBLIC,
} from "@sims/sims-db/constant";
import { SystemLookupConfigurationService } from "@sims/services/system-lookup-configuration";

/**
 * Service/Provider for Institutions controller to wrap the common methods.
 */
@Injectable()
export class InstitutionControllerService {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionTypeService: InstitutionTypeService,
    private readonly systemLookupConfigurationService: SystemLookupConfigurationService,
  ) {}

  /**
   * Get institution detail.
   * @param institutionId id for the institution to retrieved.
   * @returns Institution details.
   */
  async getInstitutionDetail(
    institutionId: number,
  ): Promise<InstitutionDetailAPIOutDTO> {
    const institutionDetail =
      await this.institutionService.getInstitutionDetailById(institutionId);

    if (!institutionDetail) {
      throw new NotFoundException("Institution not found.");
    }
    const isBCPrivate =
      INSTITUTION_TYPE_BC_PRIVATE === institutionDetail.institutionType.id;
    const isBCPublic =
      INSTITUTION_TYPE_BC_PUBLIC === institutionDetail.institutionType.id;

    // {} as AddressInfo is added to prevent old data to break.
    const mailingAddress =
      institutionDetail.institutionAddress.mailingAddress ??
      ({} as AddressInfo);
    const countryLookup = institutionDetail.country
      ? this.systemLookupConfigurationService.getSystemLookup(
          SystemLookupCategory.Country,
          institutionDetail.country,
        )
      : undefined;
    const provinceLookup = institutionDetail.province
      ? this.systemLookupConfigurationService.getSystemLookup(
          SystemLookupCategory.Province,
          institutionDetail.province,
        )
      : undefined;
    return {
      legalOperatingName: institutionDetail.legalOperatingName,
      operatingName: institutionDetail.operatingName,
      primaryPhone: institutionDetail.primaryPhone,
      primaryEmail: institutionDetail.primaryEmail,
      website: institutionDetail.website,
      regulatingBody: institutionDetail.regulatingBody,
      otherRegulatingBody: institutionDetail.otherRegulatingBody,
      institutionType: institutionDetail.institutionType.id,
      establishedDate: institutionDetail.establishedDate,
      primaryContactEmail: institutionDetail.institutionPrimaryContact.email,
      primaryContactFirstName:
        institutionDetail.institutionPrimaryContact.firstName,
      primaryContactLastName:
        institutionDetail.institutionPrimaryContact.lastName,
      primaryContactPhone: institutionDetail.institutionPrimaryContact.phone,
      mailingAddress: {
        addressLine1: mailingAddress.addressLine1,
        addressLine2: mailingAddress.addressLine2,
        city: mailingAddress.city,
        country: mailingAddress.country,
        provinceState: mailingAddress.provinceState,
        postalCode: mailingAddress.postalCode,
        selectedCountry: mailingAddress.selectedCountry,
      },
      isBCPrivate,
      isBCPublic,
      hasBusinessGuid: !!institutionDetail.businessGuid,
      // Fallback to undefined is to avoid returning null which is causing issues at the consumer side
      // and eventually all these fields should become mandatory.
      country: institutionDetail.country ?? undefined,
      province: institutionDetail.province ?? undefined,
      classification: institutionDetail.classification ?? undefined,
      organizationStatus: institutionDetail.organizationStatus ?? undefined,
      medicalSchoolStatus: institutionDetail.medicalSchoolStatus ?? undefined,
      countryName: countryLookup?.lookupValue,
      provinceName: provinceLookup?.lookupValue,
    };
  }

  /**
   * Get the list of all institutions types to be returned in an option
   * list (key/value pair) schema.
   * @returns institutions types in an option list (key/value pair) schema.
   */
  async getInstitutionTypeOptions(): Promise<OptionItemAPIOutDTO[]> {
    const institutionTypes =
      await this.institutionTypeService.getAllInstitutionTypes();
    return institutionTypes.map((institutionType) => ({
      id: institutionType.id,
      description: institutionType.name,
    }));
  }

  /**
   * Get the list of all institutions names to be returned in an option
   * list (key/value pair) schema.
   * @returns institutions names in an option list (key/value pair) schema.
   */
  async getInstitutionNameOptions(): Promise<OptionItemAPIOutDTO[]> {
    const institutions = await this.institutionService.getAllInstitutionNames();
    return institutions.map((institution) => ({
      id: institution.id,
      description: institution.operatingName,
    }));
  }

  /**
   * Validate institution lookup data(e.g. country, province).
   * @param institution institution details to validate the lookup data.
   * @throws UnprocessableEntityException when any of the lookup input is invalid.
   */
  validateLookupData(
    institution: Pick<InstitutionProfileAPIInDTO, "country" | "province">,
  ): void {
    const invalidFields: string[] = [];
    const isValidCountry =
      this.systemLookupConfigurationService.isValidSystemLookup(
        SystemLookupCategory.Country,
        institution.country,
      );
    if (!isValidCountry) {
      invalidFields.push("Country");
    }
    if (institution.province) {
      const isValidProvince =
        this.systemLookupConfigurationService.isValidSystemLookup(
          SystemLookupCategory.Province,
          institution.province,
        );
      if (!isValidProvince) {
        invalidFields.push("Province");
      }
    }
    if (invalidFields.length) {
      throw new UnprocessableEntityException(
        `Invalid value(s) found for: ${invalidFields.join(", ")}.`,
      );
    }
  }
}
