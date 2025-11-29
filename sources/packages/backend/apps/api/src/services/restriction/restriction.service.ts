import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  Restriction,
  RestrictionType,
} from "@sims/sims-db";
import { DataSource } from "typeorm";

/**
 * Service layer for restrictions.
 */
@Injectable()
export class RestrictionService extends RecordDataModelService<Restriction> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(Restriction));
  }

  /**
   * Returns all distinct restriction categories
   * @returns
   */
  async getAllRestrictionCategories(): Promise<Restriction[]> {
    return this.repo
      .createQueryBuilder("restriction")
      .select(["restriction.id", "restriction.restrictionCategory"])
      .where("restriction.restrictionCategory NOT IN ('Federal','Designation')")
      .distinctOn(["restriction.restrictionCategory"])
      .getMany();
  }

  /**
   * Returns restriction reasons(descriptions) for a
   * given restriction type and category.
   * @param restrictionType Type of the restriction.
   * @param restrictionCategory Category of the restriction.
   * @returns Restriction reasons.
   */
  async getRestrictionReasonsByCategory(
    restrictionType: RestrictionType.Provincial | RestrictionType.Institution,
    restrictionCategory: string,
  ): Promise<Restriction[]> {
    return this.repo.find({
      select: {
        id: true,
        restrictionCode: true,
        description: true,
      },
      where: {
        restrictionType,
        restrictionCategory,
      },
    });
  }

  /**
   * Returns a provincial restriction by Id.
   * @param restrictionId
   * @returns provincial restriction.
   */
  async getProvincialRestrictionById(
    restrictionId: number,
    isInstitutionRestriction?: boolean,
  ): Promise<Restriction> {
    const restrictionQuery = this.repo
      .createQueryBuilder("restriction")
      .select(["restriction.id"])
      .where("restriction.id = :restrictionId", { restrictionId })
      .andWhere("restriction.restrictionType = :restrictionType", {
        restrictionType: RestrictionType.Provincial,
      });
    if (isInstitutionRestriction) {
      restrictionQuery.andWhere(
        "restriction.restrictionCategory = 'Designation'",
      );
    }
    return restrictionQuery.getOne();
  }
}
