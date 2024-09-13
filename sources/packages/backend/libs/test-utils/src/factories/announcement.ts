import { Announcement } from "@sims/sims-db";
import * as faker from "faker";

export function createFakeAnnouncement(
  startDate: Date,
  endDate: Date,
  messageTitle?: string,
  message?: string,
  target?: string[],
): Announcement {
  const announcement = new Announcement();
  announcement.message = message ?? faker.random.words(3);
  announcement.messageTitle = messageTitle ?? faker.random.words(10);
  announcement.target = target ?? [
    "student-dashboard",
    "institution-dashboard",
  ];
  announcement.startDate = startDate;
  announcement.endDate = endDate;

  return announcement;
}
