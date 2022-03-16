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
  InstitutionReadOnlyDTO,
} from "./models/institution.dto";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { InstitutionControllerService } from "./institution.controller.service";
/**
 * Institution controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@IsInstitutionAdmin()
@Controller("institution")
@ApiTags("institution")
export class InstitutionInstitutionsController extends BaseController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionControllerService: InstitutionControllerService,
  ) {
    super();
  }

  /**
   * Get institution details of given institution.
   * @returns InstitutionReadOnlyDTO
   */
  @Get()
  async getInstitutionDetail(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionReadOnlyDTO> {
    return this.institutionControllerService.getInstitutionDetail(
      token.authorizations.institutionId,
    );
  }

  /**
   * Update institution profile details.
   * @param payload
   */
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
