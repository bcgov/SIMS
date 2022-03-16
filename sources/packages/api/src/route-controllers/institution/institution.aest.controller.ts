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
  InstitutionProfileDTO,
  InstitutionReadOnlyDTO,
} from "./models/institution.dto";
import BaseController from "../BaseController";
import { InstitutionControllerService } from "./institution.controller.service";
import { ApiTags } from "@nestjs/swagger";

/**
 * Institution controller for AEST Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("institution")
@ApiTags("institution")
export class InstitutionAESTController extends BaseController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionControllerService: InstitutionControllerService,
  ) {
    super();
  }

  /**
   * Get institution details of given institution.
   * @param institutionId
   * @returns InstitutionReadOnlyDTO
   */
  @Get("/:institutionId")
  async getInstitutionDetailById(
    @Param("institutionId") institutionId: number,
  ): Promise<InstitutionReadOnlyDTO> {
    return this.institutionControllerService.getInstitutionDetail(
      institutionId,
    );
  }

  /**
   * Update institution profile details.
   * @param institutionId
   * @param payload
   */
  @Patch("/:institutionId")
  async updateInstitution(
    @Param("institutionId") institutionId: number,
    @Body() payload: InstitutionProfileDTO,
  ): Promise<void> {
    const institution =
      this.institutionService.getBasicInstitutionDetailById(institutionId);
    if (!institution) {
      throw new NotFoundException("Institution not valid.");
    }
    await this.institutionService.updateInstitution(institutionId, payload);
  }
}
