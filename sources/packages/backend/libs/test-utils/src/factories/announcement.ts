import { Announcement } from "@sims/sims-db";
import { faker } from "@faker-js/faker";

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
    options?.initialValues?.message ?? faker.string.alpha({ length: 200 });
  announcement.messageTitle =
    options?.initialValues?.messageTitle ?? faker.string.alpha({ length: 50 });
  announcement.target = options?.initialValues?.target ?? [
    "student-dashboard",
    "institution-dashboard",
  ];
  announcement.startDate = options?.initialValues?.startDate;
  announcement.endDate = options?.initialValues?.endDate;

  return announcement;
}
