import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  Restriction,
  RestrictionType,
} from "@sims/sims-db";
import { DataSource } from "typeorm";
import { RestrictionCode } from "./models/restriction.model";

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
   * Returns all restriction reasons(description) for a given category.
   * @param restrictionCategory
   * @returns restriction reasons.
   */
  async getRestrictionReasonsByCategory(
    restrictionCategory: string,
  ): Promise<Restriction[]> {
    return this.repo
      .createQueryBuilder("restriction")
      .select([
        "restriction.id",
        "restriction.restrictionCode",
        "restriction.description",
      ])
      .where("restriction.restrictionCategory = :restrictionCategory", {
        restrictionCategory,
      })
      .andWhere("restriction.restrictionCategory != 'Federal'")
      .getMany();
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

  /**
   * Fetch the restriction with requested restriction code.
   * @param restrictionCode restriction code.
   * @returns restriction.
   */
  async getRestrictionByCode(
    restrictionCode: RestrictionCode,
  ): Promise<Restriction> {
    return this.repo
      .createQueryBuilder("restriction")
      .select("restriction.id")
      .where("restriction.restrictionCode = :restrictionCode", {
        restrictionCode,
      })
      .getOne();
  }
}
