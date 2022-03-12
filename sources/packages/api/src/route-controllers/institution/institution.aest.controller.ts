import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
} from "@nestjs/common";
import { InstitutionService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  InstitutionProfileDto,
  InstitutionReadOnlyDto,
} from "./models/institution.dto";
import { getExtendedDateFormat } from "../../utilities";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("institution")
export class InstitutionAESTController extends BaseController {
  constructor(private readonly institutionService: InstitutionService) {
    super();
  }

  /**
   * Get institution details of given institution.
   * @param institutionId
   * @returns InstitutionReadOnlyDto
   */
  @Get("/:institutionId")
  async getInstitutionDetailById(
    @Param("institutionId") institutionId: number,
  ): Promise<InstitutionReadOnlyDto> {
    const institutionDetail =
      await this.institutionService.getAESTInstitutionDetailById(institutionId);
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
        addressLine1: institutionDetail.institutionAddress.addressLine1,
        addressLine2: institutionDetail.institutionAddress.addressLine2,
        city: institutionDetail.institutionAddress.city,
        country: institutionDetail.institutionAddress.country,
        provinceState: institutionDetail.institutionAddress.provinceState,
        postalCode: institutionDetail.institutionAddress.postalCode,
      },
      clientType: ClientTypeBaseRoute.AEST,
    };
  }

  /**
   * Update institution profile details.
   * @param institutionId
   * @param payload
   */
  @Patch("/:institutionId")
  async updateInstitution(
    @Param("institutionId") institutionId: number,
    @Body() payload: InstitutionProfileDto,
  ): Promise<void> {
    const institution =
      this.institutionService.getBasicInstitutionDetailById(institutionId);
    if (!institution) {
      throw new NotFoundException("Institution not valid.");
    }
    await this.institutionService.updateInstitution(institutionId, payload);
  }
}
