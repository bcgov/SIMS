import ApiClient from "@/services/http/ApiClient";
import { AnnouncementsAPIOutDTO } from "@/services/http/dto/Announcements.dto";

/**
 * Client service layer for announcements.
 */
export class AnnouncementsService {
  // Shared Instance
  private static instance: AnnouncementsService;

  static get shared(): AnnouncementsService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get system announcements.
   * @returns system announcements list.
   */
  async getAnnouncements(): Promise<AnnouncementsAPIOutDTO[]> {
    return ApiClient.AnnouncementsApi.getAnnouncements();
  }
}
