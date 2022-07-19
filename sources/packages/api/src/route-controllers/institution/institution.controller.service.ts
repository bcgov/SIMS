import { Injectable, NotFoundException } from "@nestjs/common";
import { InstitutionService } from "../../services";
import {
  INSTITUTION_TYPE_BC_PRIVATE,
  getExtendedDateFormat,
} from "../../utilities";
import { AddressInfo } from "../../database/entities";
import { InstitutionDetailAPIOutDTO } from "./models/institution.dto";

/**
 * Service/Provider for Institutions controller to wrap the common methods.
 */
@Injectable()
export class InstitutionControllerService {
  constructor(private readonly institutionService: InstitutionService) {}

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
}
