import { Announcement } from "@sims/sims-db";
import * as faker from "faker";

/**
 * Creates an Announcement ready to be saved to the database.
 * @param options announcement options.
 * - `initialValues` Announcement values.
 * @returns an Announcement ready to be saved to the database.
 */
export function createFakeAnnouncement(options?: {
  initialValues?: Partial<Announcement>;
}): Announcement {
  const announcement = new Announcement();
  announcement.message =
    options?.initialValues?.message ?? faker.random.alpha({ count: 200 });
  announcement.messageTitle =
    options?.initialValues?.messageTitle ?? faker.random.alpha({ count: 50 });
  announcement.target = options?.initialValues?.target ?? [
    "student-dashboard",
    "institution-dashboard",
  ];
  announcement.startDate = options?.initialValues?.startDate;
  announcement.endDate = options?.initialValues?.endDate;

  return announcement;
}
