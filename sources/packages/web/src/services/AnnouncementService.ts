import ApiClient from "@/services/http/ApiClient";
import { AnnouncementsAPIOutDTO } from "@/services/http/dto/Announcement.dto";

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
   * @param target the targeted area for the announcements.
   * @returns system announcements list.
   */
  async getAnnouncements(target: string): Promise<AnnouncementsAPIOutDTO> {
    return ApiClient.AnnouncementApi.getAnnouncements(target);
  }
}
