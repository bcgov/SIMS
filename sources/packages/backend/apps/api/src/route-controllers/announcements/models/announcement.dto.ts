import { IsIn } from "class-validator";

/**
 * Announcement detail DTO. This is used for view only purpose.
 */
export class AnnouncementAPIOutDTO {
  messageTitle: string;
  message: string;
  startDate: Date;
  endDate: Date;
  target: string[];
}

export class StudentAnnouncementsAPIInDTO {
  @IsIn(["student-dashboard"])
  target: string;
}

export class InstitutionAnnouncementsAPIInDTO {
  @IsIn(["institution-dashboard"])
  target: string;
}
