import { Injectable, NotFoundException } from "@nestjs/common";
import { InstitutionService, InstitutionTypeService } from "../../services";
import {
  INSTITUTION_TYPE_BC_PRIVATE,
  getExtendedDateFormat,
} from "../../utilities";
import { AddressInfo } from "../../database/entities";
import { InstitutionDetailAPIOutDTO } from "./models/institution.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";

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
   * @param institutionId
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
      institutionType: institutionDetail.institutionType.id,
      institutionTypeName: institutionDetail.institutionType.name,
      establishedDate: institutionDetail.establishedDate,
      formattedEstablishedDate: getExtendedDateFormat(
        institutionDetail.establishedDate,
      ),
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
      isBCPrivate: isBCPrivate,
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
}
