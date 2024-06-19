import { Injectable, NotFoundException } from "@nestjs/common";
import { InstitutionService, InstitutionTypeService } from "../../services";
import { AddressInfo } from "@sims/sims-db";
import { InstitutionDetailAPIOutDTO } from "./models/institution.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import {
  INSTITUTION_TYPE_BC_PRIVATE,
  INSTITUTION_TYPE_BC_PUBLIC,
} from "@sims/sims-db/constant";

/**
 * Service/Provider for Institutions controller to wrap the common methods.
 */
@Injectable()
export class InstitutionControllerService {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionTypeService: InstitutionTypeService,
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
    return {
      legalOperatingName: institutionDetail.legalOperatingName,
      operatingName: institutionDetail.operatingName,
      primaryPhone: institutionDetail.primaryPhone,
      primaryEmail: institutionDetail.primaryEmail,
      website: institutionDetail.website,
      regulatingBody: institutionDetail.regulatingBody,
      otherRegulatingBody: institutionDetail.otherRegulatingBody,
      institutionType: institutionDetail.institutionType.id,
      institutionTypeName: institutionDetail.institutionType.name,
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
}
