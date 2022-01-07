import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { InstitutionRestriction } from "../../database/entities";

/**
 * Service layer for institution Restriction.
 */
@Injectable()
export class InstitutionRestrictionService extends RecordDataModelService<InstitutionRestriction> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(InstitutionRestriction));
  }

  /**
   * Service method to get all restrictions as a summary for an institution.
   * @param institutionId
   * @returns Institution restrictions.
   */
  async getInstitutionRestrictionsById(
    institutionId: number,
  ): Promise<InstitutionRestriction[]> {
    return this.repo
      .createQueryBuilder("institutionRestrictions")
      .select([
        "institutionRestrictions.id",
        "institutionRestrictions.isActive",
        "institutionRestrictions.updatedAt",
        "institutionRestrictions.createdAt",
        "restriction.restrictionType",
        "restriction.restrictionCategory",
        "restriction.description",
      ])
      .innerJoin("institutionRestrictions.restriction", "restriction")
      .innerJoin("institutionRestrictions.institution", "institution")
      .where("institution.id = :institutionId", { institutionId })
      .orderBy("institutionRestrictions.isActive", "DESC")
      .getMany();
  }

  /**
   * Get institution restriction detail.
   * @param institutionId
   * @param restrictionId
   * @returns
   */
  async getInstitutionRestrictionDetailsById(
    institutionId: number,
    institutionRestrictionId: number,
  ): Promise<InstitutionRestriction> {
    return this.repo
      .createQueryBuilder("institutionRestrictions")
      .select([
        "institutionRestrictions.id",
        "institutionRestrictions.isActive",
        "institutionRestrictions.updatedAt",
        "institutionRestrictions.createdAt",
        "creator.firstName",
        "creator.lastName",
        "modifier.firstName",
        "modifier.lastName",
        "restriction.restrictionType",
        "restriction.restrictionCategory",
        "restriction.description",
        "restrictionNote.description",
        "resolutionNote.description",
      ])
      .innerJoin("institutionRestrictions.restriction", "restriction")
      .leftJoin("institutionRestrictions.creator", "creator")
      .leftJoin("institutionRestrictions.modifier", "modifier")
      .innerJoin("institutionRestrictions.institution", "institution")
      .leftJoin("institutionRestrictions.restrictionNote", "restrictionNote")
      .leftJoin("institutionRestrictions.resolutionNote", "resolutionNote")
      .where("institution.id = :institutionId", { institutionId })
      .andWhere("institutionRestrictions.id = :institutionRestrictionId", {
        institutionRestrictionId,
      })
      .getOne();
  }
}
