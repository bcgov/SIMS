import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { AnnouncementAPIOutDTO } from "@/services/http/dto/Announcement.dto";

/**
 * Http API client for system announcements.
 */
export class AnnouncementApi extends HttpBaseClient {
  /**
   * Get the list of announcements.
   * @returns list of announcements.
   */
  async getAnnouncements(): Promise<AnnouncementAPIOutDTO[]> {
    return this.getCall<AnnouncementAPIOutDTO[]>("announcements");
  }
}
