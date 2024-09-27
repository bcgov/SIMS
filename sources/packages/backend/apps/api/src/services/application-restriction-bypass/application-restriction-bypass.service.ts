import { Injectable } from "@nestjs/common";
import {
  ApplicationRestrictionBypass,
  ApplicationStatus,
  RecordDataModelService,
} from "@sims/sims-db";
import { DataSource, Not } from "typeorm";

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
        isActive: true,
        studentRestriction: {
          id: true,
          isActive: true,
          restriction: {
            id: true,
            restrictionCategory: true,
            restrictionCode: true,
          },
        },
      },
      relations: {
        studentRestriction: { restriction: true },
      },
      where: {
        application: {
          id: applicationId,
          applicationStatus: Not(ApplicationStatus.Draft),
        },
      },
      order: { createdAt: "DESC" },
    });
  }
}
