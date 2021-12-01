import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Restriction, RestrictionType } from "../../database/entities";
import { Connection, Repository } from "typeorm";
import { FEDERAL_RESTRICTIONS_UNIDENTIFIED_DESCRIPTION } from "../../utilities";

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
