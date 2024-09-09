/**
 * Announcements details.
 */
export interface AnnouncementAPIOutDTO {
  message_title: string;
  message: string;
  start_date: Date;
  end_date: Date;
  target: string[];
}
