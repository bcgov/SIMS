import { Injectable } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
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
import { DataSource, EntityManager } from "typeorm";

/**
 * Service layer for restrictions.
 */
@Injectable()
export class RestrictionService extends RecordDataModelService<Restriction> {
  constructor(
    dataSource: DataSource,
    private readonly systemUsersService: SystemUsersService,
  ) {
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
   * During import operations for federal restriction, if there are
   * restriction codes not present on the database, new restrictions
   * will be created.
   * @param codes codes to create the new restrictions.
   * @param entityManager entity manager to execute in transaction.
   * @returns newly created restrictions.
   */
  async createUnidentifiedFederalRestrictions(
    codes: string[],
    entityManager: EntityManager,
  ): Promise<Restriction[]> {
    const repo = entityManager.getRepository(Restriction);
    const uniqueMissingCodes = [...new Set(codes)];
    const now = new Date();
    const newRestrictions = uniqueMissingCodes.map((code) => {
      const newRestriction = new Restriction();
      newRestriction.description =
        FEDERAL_RESTRICTIONS_UNIDENTIFIED_DESCRIPTION;
      newRestriction.restrictionCode = code;
      newRestriction.restrictionType = RestrictionType.Federal;
      newRestriction.notificationType = RestrictionNotificationType.Error;
      newRestriction.actionType = [
        RestrictionActionType.StopFullTimeDisbursement,
        RestrictionActionType.StopPartTimeDisbursement,
      ];
      newRestriction.restrictionCategory = "Federal";
      newRestriction.creator = this.systemUsersService.systemUser;
      newRestriction.createdAt = now;
      return newRestriction;
    });
    return repo.save(newRestrictions);
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
    return repo
      .createQueryBuilder("restriction")
      .select(["restriction.id", "restriction.restrictionCode"])
      .where("restriction.actionEffectiveConditions = :conditions", {
        conditions: JSON.stringify([aviationCredentialTypeCondition]),
      })
      .andWhere("restriction.isLegacy = false")
      .getOne();
  }
}
