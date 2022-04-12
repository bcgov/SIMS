import { Body, Controller, Patch, Get } from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import { InstitutionService } from "../../services";

import {
  InstitutionContactDTO,
  InstitutionDetailDTO,
} from "./models/institution.dto";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { InstitutionControllerService } from "./institution.controller.service";
import { ClientTypeBaseRoute } from "../../types";

/**
 * Institution controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution")
@ApiTags(`${ClientTypeBaseRoute.Institution}-institution`)
export class InstitutionInstitutionsController extends BaseController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionControllerService: InstitutionControllerService,
  ) {
    super();
  }

  /**
   * Get institution details of given institution.
   * @returns InstitutionDetailDTO
   */
  @IsInstitutionAdmin()
  @Get()
  async getInstitutionDetail(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionDetailDTO> {
    return this.institutionControllerService.getInstitutionDetail(
      token.authorizations.institutionId,
    );
  }

  /**
   * Update institution profile details.
   * @param payload
   */
  @IsInstitutionAdmin()
  @Patch()
  async update(
    @Body() payload: InstitutionContactDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    await this.institutionService.updateInstitution(
      userToken.authorizations.institutionId,
      payload,
    );
  }
}
