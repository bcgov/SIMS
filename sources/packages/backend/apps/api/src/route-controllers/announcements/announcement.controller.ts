import { Controller, Get } from "@nestjs/common";
import BaseController from "../BaseController";
import { ApiTags } from "@nestjs/swagger";
import { Announcement } from "@sims/sims-db";
import { AnnouncementService } from "../../services";
import { Public } from "../../auth/decorators/public.decorator";

@Controller("announcements")
@ApiTags("announcements")
export class AnnouncementController extends BaseController {
  constructor(private readonly announcementService: AnnouncementService) {
    super();
  }

  @Public()
  @Get()
  async getAnnouncements(): Promise<Announcement[]> {
    return this.announcementService.getAnnouncements();
  }
}
