import { Controller, Get } from "@nestjs/common";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";
import { AnnouncementsService } from "apps/api/src/services/announcements/announcements.service";

@AllowAuthorizedParty(
  AuthorizedParties.institution,
  AuthorizedParties.student,
  AuthorizedParties.supportingUsers,
  AuthorizedParties.aest,
)
@Controller("announcements")
@ApiTags("announcements")
export class AnnouncementsController extends BaseController {
  constructor(private readonly announcementsService: AnnouncementsService) {
    super();
  }

  @Get()
  async list(): Promise<any> {
    return this.announcementsService.getAnnouncements();
  }
}
