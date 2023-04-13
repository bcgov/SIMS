import { Injectable } from "@nestjs/common";
import { RecordDataModelService, Restriction } from "@sims/sims-db";
import { DataSource } from "typeorm";
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
