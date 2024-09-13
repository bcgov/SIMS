import { Controller, Get, Query } from "@nestjs/common";
import BaseController from "../BaseController";
import { ApiTags } from "@nestjs/swagger";
import { Announcement } from "@sims/sims-db";
import { AnnouncementService } from "../../services";
import {
  AnnouncementsAPIOutDTO,
  InstitutionAnnouncementsAPIInDTO,
} from "../../route-controllers/announcements/models/announcement.dto";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth";
import { ClientTypeBaseRoute } from "../../types";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("announcements")
@ApiTags(`${ClientTypeBaseRoute.Institution}-announcements`)
export class AnnouncementInstitutionsController extends BaseController {
  constructor(private readonly announcementService: AnnouncementService) {
    super();
  }

  /**
   * Get system announcements.
   * @param target location for the announcement.
   * @returns system announcements list.
   */
  @Get()
  async getAnnouncements(
    @Query() queryString: InstitutionAnnouncementsAPIInDTO,
  ): Promise<AnnouncementsAPIOutDTO> {
    const announcements = await this.announcementService.getAnnouncements(
      queryString.target,
    );
    const announcementsResponse = announcements.map((announcement) => ({
      messageTitle: announcement.messageTitle,
      message: announcement.message,
      startDate: announcement.startDate,
      endDate: announcement.endDate,
      target: announcement.target,
    }));

    return { announcements: announcementsResponse };
  }
}
