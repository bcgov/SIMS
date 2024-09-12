import { Injectable } from "@nestjs/common";
import { Announcement, DataModelService } from "@sims/sims-db";
import {
  ArrayOverlap,
  DataSource,
  LessThanOrEqual,
  MoreThanOrEqual,
} from "typeorm";

@Injectable()
export class AnnouncementService extends DataModelService<Announcement> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(Announcement));
  }

  /**
   * Get system announcements.
   * @param target the dashboard for which the announcement will be shown on.
   * @returns system announcements list.
   */
  async getAnnouncements(target: string): Promise<Announcement[]> {
    const now = new Date();
    return this.repo.find({
      where: {
        target: ArrayOverlap([target]),
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { startDate: "ASC" },
    });
  }
}
