import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  Restriction,
  RestrictionType,
} from "@sims/sims-db";
import { DataSource, EntityManager } from "typeorm";

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
      order: { restrictionCode: "ASC" },
    });
  }

  /**
   * Checks if a restriction exists for the given restriction ID and type.
   * @param restrictionId Restriction ID.
   * @param restrictionType Restriction type.
   * @returns Provincial restriction.
   */
  async restrictionExists(
    restrictionId: number,
    restrictionType: RestrictionType,
    options?: { entityManager?: EntityManager },
  ): Promise<boolean> {
    const repo =
      options?.entityManager?.getRepository(Restriction) ?? this.repo;
    return repo.exists({ where: { id: restrictionId, restrictionType } });
  }
}
