/**
 * Announcements details.
 */
export interface AnnouncementAPIOutDTO {
  messageTitle: string;
  message: string;
  startDate: Date;
  endDate: Date;
  target: string[];
}

export interface AnnouncementsAPIOutDTO {
  announcements: AnnouncementAPIOutDTO[];
}
