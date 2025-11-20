import { Controller, Get, Param, Query } from "@nestjs/common";
import BaseController from "../BaseController";
import { AnnouncementService } from "../../services";
import {
  AESTAnnouncementsAPIInDTO,
  AnnouncementsAPIOutDTO,
} from "./models/announcement.dto";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Controller("announcements")
export class AnnouncementController extends BaseController {
  constructor(private readonly announcementService: AnnouncementService) {
    super();
  }

  /**
   * Get system announcements
   * @param systemAnnouncementOptions target for the announcement
   * @returns sistem announcement list
   */
  @Get(":id")
  async getAnnouncements(
    @Query() systemAnnouncementOptions: AESTAnnouncementsAPIInDTO,
    @Param("applicationId") id: number,
  ): Promise<AnnouncementsAPIOutDTO> {
    const announcements = await this.announcementService.getAnnouncements(
      systemAnnouncementOptions.target,
    );
    const announcementsResponse = announcements.map((announcement) => ({
      messageTitle: announcement.messageTitle + id,
      message: announcement.message,
      startDate: announcement.startDate,
      endDate: announcement.endDate,
      target: announcement.target,
    }));

    return { announcements: announcementsResponse };
  }
}
