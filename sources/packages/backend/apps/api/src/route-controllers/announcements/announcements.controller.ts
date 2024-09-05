import { Controller, Get } from "@nestjs/common";
import BaseController from "../BaseController";
import { ApiTags } from "@nestjs/swagger";
import { Announcements } from "@sims/sims-db";
import { AnnouncementsService } from "../../services";
import { Public } from "../../auth/decorators/public.decorator";

@Controller("announcements")
@ApiTags("announcements")
export class AnnouncementsController extends BaseController {
  constructor(private readonly announcementsService: AnnouncementsService) {
    super();
  }

  @Public()
  @Get()
  async getAnnouncements(): Promise<Announcements[]> {
    return this.announcementsService.getAnnouncements();
  }
}
