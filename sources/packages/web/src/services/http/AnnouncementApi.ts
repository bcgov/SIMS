import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { AnnouncementAPIOutDTO } from "@/services/http/dto/Announcement.dto";

/**
 * Http API client for system announcements.
 */
export class AnnouncementApi extends HttpBaseClient {
  /**
   * Get the list of announcements.
   * @param target the targeted area for the announcements.
   * @returns list of announcements.
   */
  async getAnnouncements(target: string): Promise<AnnouncementAPIOutDTO[]> {
    return this.getCall<AnnouncementAPIOutDTO[]>(
      this.addClientRoot(`announcements?target=${target}`),
    );
  }
}
