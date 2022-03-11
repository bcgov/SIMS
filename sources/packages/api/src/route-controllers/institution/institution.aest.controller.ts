import { Controller, Get, Param } from "@nestjs/common";
import { InstitutionService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { InstitutionReadOnlyDto } from "./models/institution.dto";
import { getExtendedDateFormat } from "../../utilities";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("institution")
export class InstitutionAESTController {
  constructor(private readonly institutionService: InstitutionService) {}

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
      institutionTypeName: institutionDetail.institutionType.name,
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
      address: {
        addressLine1: institutionDetail.institutionAddress.addressLine1,
        addressLine2: institutionDetail.institutionAddress.addressLine2,
        city: institutionDetail.institutionAddress.city,
        country: institutionDetail.institutionAddress.country,
        provinceState: institutionDetail.institutionAddress.provinceState,
        postalCode: institutionDetail.institutionAddress.postalCode,
      },
    };
  }
}
