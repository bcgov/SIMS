import { Injectable } from "@nestjs/common";
import { Announcements, RecordDataModelService } from "@sims/sims-db";
import { DataSource } from "typeorm";

@Injectable()
export class AnnouncementsService extends RecordDataModelService<Announcements> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(Announcements));
  }

  /**
   * Get system announcements.
   * @returns system announcements list.
   */
  async getAnnouncements(): Promise<Announcements[]> {
    return this.repo.find({
      select: {
        id: true,
        messageTitle: true,
        message: true,
        target: true,
        startDate: true,
        endDate: true,
      },
      order: { startDate: "ASC" },
    });
  }
}
