import { Injectable } from "@nestjs/common";
import {
  ApplicationRestrictionBypass,
  RecordDataModelService,
} from "@sims/sims-db";
import { DataSource } from "typeorm";

/**
 * Service layer for application restriction bypasses.
 */
@Injectable()
export class ApplicationRestrictionBypassService extends RecordDataModelService<ApplicationRestrictionBypass> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(ApplicationRestrictionBypass));
  }

  /**
   * Returns all application restriction bypasses for a given application.
   * @param applicationId id of the application to retrieve restriction bypasses.
   * @returns application restriction bypasses.
   */
  async getApplicationRestrictionBypasses(
    applicationId: number,
  ): Promise<ApplicationRestrictionBypass[]> {
    return this.repo.find({
      select: {
        id: true,
        application: { id: true },
        studentRestriction: {
          id: true,
          isActive: true,
          restriction: {
            id: true,
            restrictionType: true,
            restrictionCode: true,
          },
        },
      },
      relations: {
        application: true,
        studentRestriction: { restriction: true },
      },
      where: {
        application: { id: applicationId },
      },
      order: { createdAt: "DESC" },
    });
  }
}
