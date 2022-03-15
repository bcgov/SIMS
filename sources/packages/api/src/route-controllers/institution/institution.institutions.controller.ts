import { Body, Controller, Patch, Get, HttpStatus } from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  IsInstitutionAdmin,
  UserToken,
} from "../../auth/decorators";
import { InstitutionService } from "../../services";

import {
  InstitutionContactDto,
  InstitutionReadOnlyDto,
} from "./models/institution.dto";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { InstitutionControllerService } from "./institution.controller.service";
import { ClientTypeBaseRoute } from "../../types";

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
   * @returns InstitutionReadOnlyDto
   */
  @Get()
  @ApiOperation({
    summary: "API for institutions client to get all institutions.",
  })
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: "Accepted" })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized error",
  })
  async getInstitutionDetail(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionReadOnlyDto> {
    return this.institutionControllerService.getInstitutionDetail(
      token.authorizations.institutionId,
      ClientTypeBaseRoute.Institution,
    );
  }

  /**
   * Update institution profile details.
   * @param payload
   */
  @Patch()
  @ApiOperation({
    summary: "API for institutions client to update an institution.",
  })
  @ApiResponse({ status: HttpStatus.ACCEPTED, description: "Accepted" })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Unauthorized error",
  })
  async update(
    @Body() payload: InstitutionContactDto,
    @UserToken() userToken: IInstitutionUserToken,
  ) {
    await this.institutionService.updateInstitution(
      userToken.authorizations.institutionId,
      payload,
    );
  }
}
