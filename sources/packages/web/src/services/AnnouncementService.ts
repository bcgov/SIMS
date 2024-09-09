import ApiClient from "@/services/http/ApiClient";
import { AnnouncementAPIOutDTO } from "@/services/http/dto/Announcement.dto";

/**
 * Client service layer for announcements.
 */
export class AnnouncementService {
  // Shared Instance
  private static instance: AnnouncementService;

  static get shared(): AnnouncementService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get system announcements.
   * @returns system announcements list.
   */
  async getAnnouncements(): Promise<AnnouncementAPIOutDTO[]> {
    return ApiClient.AnnouncementApi.getAnnouncements();
  }
}
