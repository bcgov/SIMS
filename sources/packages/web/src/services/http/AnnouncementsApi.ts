import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { AnnouncementsAPIOutDTO } from "@/services/http/dto/Announcements.dto";

/**
 * Http API client for system announcements.
 */
export class AnnouncementsApi extends HttpBaseClient {
  /**
   * Get the list of announcements.
   * @returns list of announcements.
   */
  async getAnnouncements(): Promise<AnnouncementsAPIOutDTO[]> {
    return this.getCall<AnnouncementsAPIOutDTO[]>("announcements");
  }
}
