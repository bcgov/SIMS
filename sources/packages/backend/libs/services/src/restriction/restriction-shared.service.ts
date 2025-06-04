import { Injectable } from "@nestjs/common";
import { RecordDataModelService, Restriction } from "@sims/sims-db";
import { DataSource, EntityManager } from "typeorm";
import { RestrictionCode } from "..";

/**
 * Service layer for restrictions.
 */
@Injectable()
export class RestrictionSharedService extends RecordDataModelService<Restriction> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(Restriction));
  }

  /**
   * Fetch the restriction with requested restriction code.
   * @param restrictionCode restriction code.
   * @param entityManager optional entity manager to operate within a transaction.
   * @returns restriction.
   */
  async getRestrictionByCode(
    restrictionCode: RestrictionCode,
    entityManager?: EntityManager,
  ): Promise<Restriction> {
    const restrictionRepo =
      entityManager?.getRepository(Restriction) ?? this.repo;
    return restrictionRepo
      .createQueryBuilder("restriction")
      .select("restriction.id")
      .where("restriction.restrictionCode = :restrictionCode", {
        restrictionCode,
      })
      .getOne();
  }
}
