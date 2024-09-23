import { Injectable } from "@nestjs/common";
import {
  ApplicationRestrictionBypass,
  ApplicationStatus,
  RecordDataModelService,
} from "@sims/sims-db";
import { ApplicationRestrictionBypassSummaryAPIOutDTO } from "apps/api/src/route-controllers/application-restriction-bypass/models/application-restriction-bypass.dto";
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
   * Returns all restriction bypasses for a given application.
   * @param applicationId id of the application to retrieve restriction bypasses.
   * @returns application restriction bypasses.
   */
  async getApplicationRestrictionBypasses(
    applicationId: number,
  ): Promise<ApplicationRestrictionBypassSummaryAPIOutDTO[]> {
    return this.repo
      .createQueryBuilder("applicationRestrictionBypass")
      .select("applicationRestrictionBypass.id", "id")
      .addSelect("applicationRestrictionBypass.createdAt", "createdAt")
      .addSelect("restriction.restrictionType", "restrictionType")
      .addSelect("restriction.restrictionCode", "restrictionCode")
      .addSelect("studentRestriction.isActive", "isActive")
      .innerJoin(
        "applicationRestrictionBypass.studentRestriction",
        "studentRestriction",
      )
      .innerJoin("studentRestriction.restriction", "restriction")
      .innerJoin("applicationRestrictionBypass.application", "application")
      .where("application.id = :applicationId", {
        applicationId,
      })
      .andWhere("application.applicationStatus != :applicationStatus", {
        applicationStatus: ApplicationStatus.Draft,
      })
      .orderBy("applicationRestrictionBypass.createdAt", "DESC")
      .getRawMany<ApplicationRestrictionBypassSummaryAPIOutDTO>();
  }
}
