import { Injectable, NotFoundException } from "@nestjs/common";
import { InstitutionService } from "../../services";
import {
  INSTITUTION_TYPE_BC_PRIVATE,
  getExtendedDateFormat,
  transformToInstitutionUserRespDto,
  PaginationOptions,
  PaginatedResults,
} from "../../utilities";
import { InstitutionUser } from "../../database/entities";
import { InstitutionDetailAPIOutDTO } from "./models/institution.dto";
import { InstitutionUserAPIOutDTO } from "./models/institution-user.dto";

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
      primaryContactEmail:
        institutionDetail.institutionPrimaryContact.primaryContactEmail,
      primaryContactFirstName:
        institutionDetail.institutionPrimaryContact.primaryContactFirstName,
      primaryContactLastName:
        institutionDetail.institutionPrimaryContact.primaryContactLastName,
      primaryContactPhone:
        institutionDetail.institutionPrimaryContact.primaryContactPhone,
      mailingAddress: {
        addressLine1:
          institutionDetail.institutionAddress.address?.addressLine1,
        addressLine2:
          institutionDetail.institutionAddress.address?.addressLine2,
        city: institutionDetail.institutionAddress.address?.city,
        country: institutionDetail.institutionAddress.address?.country,
        provinceState:
          institutionDetail.institutionAddress.address?.provinceState,
        postalCode: institutionDetail.institutionAddress.address?.postalCode,
        selectedCountry:
          institutionDetail.institutionAddress.address?.selectedCountry,
      },
      isBCPrivate: isBCPrivate,
    };
  }

  /**
   * Get institution users with page, sort and search.
   * @param institutionId
   * @param paginationOptions
   * @returns Institution Users.
   */
  async getInstitutionUsers(
    institutionId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<InstitutionUserAPIOutDTO>> {
    const [institutionUsers, count] =
      await this.institutionService.getInstitutionUsers(
        institutionId,
        paginationOptions,
      );

    return {
      results: institutionUsers.map((eachInstitutionUser: InstitutionUser) => {
        return transformToInstitutionUserRespDto(eachInstitutionUser);
      }),
      count: count,
    };
  }
}
