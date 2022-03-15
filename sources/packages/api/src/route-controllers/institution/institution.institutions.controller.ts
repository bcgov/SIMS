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
  InstitutionContactDto,
  InstitutionReadOnlyDto,
} from "./models/institution.dto";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { InstitutionControllerService } from "./institution.controller.service";
import { ClientTypeBaseRoute } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.institution)
@IsInstitutionAdmin()
@Controller("institution")
@ApiTags("institutions")
export class InstitutionInstitutionsController extends BaseController {
  constructor(
    private readonly institutionService: InstitutionService,
    private readonly institutionControllerService: InstitutionControllerService,
  ) {
    super();
  }

  @Get()
  async getInstitutionDetail(
    @UserToken() token: IInstitutionUserToken,
  ): Promise<InstitutionReadOnlyDto> {
    return this.institutionControllerService.getInstitutionDetail(
      token.authorizations.institutionId,
      ClientTypeBaseRoute.Institution,
    );
  }

  @Patch()
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
