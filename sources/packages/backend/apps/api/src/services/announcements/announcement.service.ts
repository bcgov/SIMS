import { Injectable } from "@nestjs/common";
import { Announcement, RecordDataModelService } from "@sims/sims-db";
import { DataSource, LessThanOrEqual, MoreThanOrEqual } from "typeorm";

@Injectable()
export class AnnouncementService extends RecordDataModelService<Announcement> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(Announcement));
  }

  /**
   * Get system announcements.
   * @returns system announcements list.
   */
  async getAnnouncements(): Promise<Announcement[]> {
    const now = new Date();
    return this.repo.find({
      where: {
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      order: { startDate: "ASC" },
    });
  }
}
