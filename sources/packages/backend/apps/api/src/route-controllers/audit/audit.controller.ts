import { Controller, Post, Req, Body } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties, IUserToken } from "../../auth";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import BaseController from "../BaseController";
import { AuditService } from "../../services";
import { Request } from "express";
import { AuditAPIInDTO } from "./models/audit.dto";

@AllowAuthorizedParty(
  AuthorizedParties.institution,
  AuthorizedParties.student,
  AuthorizedParties.supportingUsers,
  AuthorizedParties.aest,
)
@Controller("audit")
@ApiTags("audit")
export class AuditController extends BaseController {
  constructor(private readonly auditService: AuditService) {
    super();
  }

  /**
   * Audit events log.
   * @param event audit event.
   * @param userToken user token.
   * @param request request object.
   */
  @Post()
  audit(
    @Body() payload: AuditAPIInDTO,
    @UserToken() userToken: IUserToken,
    @Req() request: Request,
  ): void {
    const clientIp =
      (request.headers["x-forwarded-for"] as string) ||
      request.socket.remoteAddress;
    this.auditService.audit(
      clientIp,
      userToken.userName,
      payload.event,
      userToken.azp,
    );
  }
}
