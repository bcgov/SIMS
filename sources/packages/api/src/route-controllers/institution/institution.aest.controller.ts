import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  HttpStatus,
} from "@nestjs/common";
import { InstitutionService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  InstitutionProfileDto,
  InstitutionReadOnlyDto,
} from "./models/institution.dto";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { InstitutionControllerService } from "./institution.controller.service";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

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
   * @returns InstitutionReadOnlyDto
   */
  @Get("/:institutionId")
  @ApiOperation({
    summary: "API for AEST client to get all institutions.",
  })
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: "Accepted" })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Institution not valid.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized error",
  })
  async getInstitutionDetailById(
    @Param("institutionId") institutionId: number,
  ): Promise<InstitutionReadOnlyDto> {
    return this.institutionControllerService.getInstitutionDetail(
      institutionId,
      ClientTypeBaseRoute.AEST,
    );
  }

  /**
   * Update institution profile details.
   * @param institutionId
   * @param payload
   */
  @Patch("/:institutionId")
  @ApiOperation({
    summary: "API for AEST client to update an institution.",
  })
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: "Accepted" })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Institution not valid.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized error",
  })
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
