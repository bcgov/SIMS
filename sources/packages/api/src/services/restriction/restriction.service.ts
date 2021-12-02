import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Restriction, RestrictionType } from "../../database/entities";
import { Connection, Repository } from "typeorm";
import { FEDERAL_RESTRICTIONS_UNIDENTIFIED_DESCRIPTION } from "../../utilities";
import { EnsureFederalRestrictionResult } from "./models/federal-restriction.model";

/**
 * Service layer for Restriction
 */
@Injectable()
export class RestrictionService extends RecordDataModelService<Restriction> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(Restriction));
  }

  async getAllFederalRestrictions(): Promise<Restriction[]> {
    return this.repo
      .createQueryBuilder("restriction")
      .select(["restriction.id", "restriction.restrictionCode"])
      .where("restriction.restrictionType = :restrictionType", {
        restrictionType: RestrictionType.Federal,
      })
      .getMany();
  }

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

  async createUnidentifiedFederalRestriction(
    code: string,
    externalRepo?: Repository<Restriction>,
  ): Promise<Restriction> {
    const repo = externalRepo ?? this.repo;
    const newRestriction = new Restriction();
    newRestriction.description = FEDERAL_RESTRICTIONS_UNIDENTIFIED_DESCRIPTION;
    newRestriction.restrictionCode = code;
    newRestriction.restrictionType = RestrictionType.Federal;
    return repo.save(newRestriction);
  }
}
