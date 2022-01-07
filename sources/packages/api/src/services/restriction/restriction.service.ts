import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Restriction, RestrictionType } from "../../database/entities";
import { Connection, Repository } from "typeorm";
import { FEDERAL_RESTRICTIONS_UNIDENTIFIED_DESCRIPTION } from "../../utilities";
import { EnsureFederalRestrictionResult } from "./models/federal-restriction.model";

/**
 * Service layer for restrictions.
 */
@Injectable()
export class RestrictionService extends RecordDataModelService<Restriction> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(Restriction));
  }

  /**
   * Get the list of all federal restrictions.
   * @returns list of all federal restrictions.
   */
  async getAllFederalRestrictions(): Promise<Restriction[]> {
    return this.repo
      .createQueryBuilder("restriction")
      .select(["restriction.id", "restriction.restrictionCode"])
      .where("restriction.restrictionType = :restrictionType", {
        restrictionType: RestrictionType.Federal,
      })
      .getMany();
  }

  /**
   * Check the list of the restriction codes provided to identified
   * possible missing codes. If some missing code is identified,
   * a new restriction is created.
   * @param restrictionCodes code to be verified.
   * @param [externalRepo] when provided, it is used instead of the
   * local repository (this.repo). Useful when the command must be executed,
   * for instance, as part of an existing transaction manage externally to this
   * service.
   * @returns the complete list with all exceptions needed to satisfy the
   * restriction codes provided with an additional list of the created ones.
   */
  async ensureFederalRestrictionExists(
    restrictionCodes: string[],
    externalRepo?: Repository<Restriction>,
  ): Promise<EnsureFederalRestrictionResult> {
    const result = new EnsureFederalRestrictionResult();
    result.restrictions = await this.getAllFederalRestrictions();

    for (const code of restrictionCodes) {
      const foundRestriction = result.restrictions.find(
        (restriction) => restriction.restrictionCode === code,
      );
      if (!foundRestriction) {
        const newRestriction = await this.createUnidentifiedFederalRestriction(
          code,
          externalRepo,
        );
        result.restrictions.push(newRestriction);
        result.createdRestrictionsCodes.push(newRestriction.restrictionCode);
      }
    }

    return result;
  }

  /**
   * During import operations for federal restriction, if there is
   * a restriction code not present on the database, a new restriction
   * will be create with a generic restriction.
   * @param code code to create the new restriction.
   * @param [externalRepo] when provided, it is used instead of the
   * local repository (this.repo). Useful when the command must be executed,
   * for instance, as part of an existing transaction manage externally to this
   * service.
   * @returns newly create restriction.
   */
  async createUnidentifiedFederalRestriction(
    code: string,
    externalRepo?: Repository<Restriction>,
  ): Promise<Restriction> {
    const repo = externalRepo ?? this.repo;
    const newRestriction = new Restriction();
    newRestriction.description = FEDERAL_RESTRICTIONS_UNIDENTIFIED_DESCRIPTION;
    newRestriction.restrictionCode = code;
    newRestriction.restrictionType = RestrictionType.Federal;
    /*  Restriction Category is hard coded for federal restrictions.  */
    newRestriction.restrictionCategory = "Federal";
    return repo.save(newRestriction);
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
      .andWhere("restriction.restrictionType = 'Provincial'");
    if (isInstitutionRestriction) {
      restrictionQuery.andWhere(
        "restriction.restrictionCategory = 'Designation'",
      );
    }
    return restrictionQuery.getOne();
  }
}
