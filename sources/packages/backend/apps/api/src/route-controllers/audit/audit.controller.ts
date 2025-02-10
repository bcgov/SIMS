import { Controller, Post, Req, Body } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties, IUserToken } from "../../auth";
import {
  AllowAuthorizedParty,
  RequiresUserAccount,
  UserToken,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import { AuditService } from "../../services";
import { Request } from "express";
import { AuditAPIInDTO } from "./models/audit.dto";
import { getClientIPFromRequest } from "../../utilities";

@AllowAuthorizedParty(
  AuthorizedParties.institution,
  AuthorizedParties.student,
  AuthorizedParties.supportingUsers,
  AuthorizedParties.aest,
)
@RequiresUserAccount(false)
@Controller("audit")
@ApiTags("audit")
export class AuditController extends BaseController {
  constructor(private readonly auditService: AuditService) {
    super();
  }

  /**
   * Audit events log.
   * @param payload payload.
   * @param userToken user token.
   * @param request request object.
   */
  @Post()
  audit(
    @Body() payload: AuditAPIInDTO,
    @UserToken() userToken: IUserToken,
    @Req() request: Request,
  ): void {
    const clientIP = getClientIPFromRequest(request);
    this.auditService.audit(
      clientIP,
      userToken.userName,
      payload.event,
      userToken.azp,
    );
  }
}
