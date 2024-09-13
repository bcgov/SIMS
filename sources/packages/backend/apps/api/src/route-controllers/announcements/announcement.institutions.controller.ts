import { Controller, Get, Query } from "@nestjs/common";
import BaseController from "../BaseController";
import { ApiTags } from "@nestjs/swagger";
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
   * @param systemAnnouncementOptions target for the announcement.
   * @returns system announcements list.
   */
  @Get()
  async getAnnouncements(
    @Query() systemAnnouncementOptions: InstitutionAnnouncementsAPIInDTO,
  ): Promise<AnnouncementsAPIOutDTO> {
    const announcements = await this.announcementService.getAnnouncements(
      systemAnnouncementOptions.target,
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
