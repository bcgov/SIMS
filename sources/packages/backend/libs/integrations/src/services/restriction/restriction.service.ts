import { Injectable } from "@nestjs/common";
import { FEDERAL_RESTRICTIONS_UNIDENTIFIED_DESCRIPTION } from "@sims/services/constants";
import {
  ActionEffectiveCondition,
  ActionEffectiveConditionNames,
  RecordDataModelService,
  Restriction,
  RestrictionActionType,
  RestrictionNotificationType,
  RestrictionType,
} from "@sims/sims-db";
import { DataSource, EntityManager, Repository } from "typeorm";
import { EnsureFederalRestrictionResult } from "./models/federal-restriction.model";

/**
 * Service layer for restrictions.
 */
@Injectable()
export class RestrictionService extends RecordDataModelService<Restriction> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(Restriction));
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
    newRestriction.notificationType = RestrictionNotificationType.Error;
    newRestriction.actionType = [
      RestrictionActionType.StopFullTimeDisbursement,
      RestrictionActionType.StopPartTimeDisbursement,
    ];
    /*  Restriction Category is hard coded for federal restrictions.  */
    newRestriction.restrictionCategory = "Federal";
    return repo.save(newRestriction);
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
   * Get the restriction for aviation credential type.
   * @param aviationCredentialType aviation credential type.
   * @param options options.
   *  - `entityManager` entity manager to execute in transaction.
   * @returns restriction for the aviation credential type.
   */
  async getRestrictionForAviationCredentialType(
    aviationCredentialType: string,
    options?: { entityManager?: EntityManager },
  ): Promise<Restriction> {
    const aviationCredentialTypeCondition: ActionEffectiveCondition = {
      name: ActionEffectiveConditionNames.AviationCredentialTypes,
      value: [aviationCredentialType],
    };
    const repo =
      options?.entityManager?.getRepository(Restriction) ?? this.repo;
    return repo.findOne({
      select: { id: true, restrictionCode: true },
      where: {
        actionEffectiveConditions: aviationCredentialTypeCondition,
        isLegacy: false,
      },
    });
  }
}
