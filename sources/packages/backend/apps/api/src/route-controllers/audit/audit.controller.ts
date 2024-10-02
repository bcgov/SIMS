import { Controller, Post, Param, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties, IUserToken } from "../../auth";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import BaseController from "../BaseController";
import { Request } from "express";
import { AuditService } from "../../services";
import { AuditEvent } from "../../services/audit/audit-event.enum";

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
  @Post(":event")
  async audit(
    @Param("event") event: AuditEvent,
    @UserToken() userToken: IUserToken,
    @Req() request: Request,
  ): Promise<void> {
    const clientIp =
      request.headers["x-forwarded-for"] || request.socket.remoteAddress;
    this.auditService.audit(clientIp, userToken.userName, event, userToken.azp);
  }
}
