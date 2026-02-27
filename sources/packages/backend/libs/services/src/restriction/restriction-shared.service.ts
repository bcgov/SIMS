import { Injectable } from "@nestjs/common";
import {
  InstitutionRestriction,
  RecordDataModelService,
  Restriction,
} from "@sims/sims-db";
import { Brackets, DataSource, EntityManager, Repository } from "typeorm";
import { RestrictionCode } from "..";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Service layer for restrictions.
 */
@Injectable()
export class RestrictionSharedService extends RecordDataModelService<Restriction> {
  constructor(
    dataSource: DataSource,
    @InjectRepository(InstitutionRestriction)
    private readonly institutionRestrictionRepo: Repository<InstitutionRestriction>,
  ) {
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
  /**
   * Get the effective institution restrictions for the given institution, program and location.
   * @param institutionId institution id.
   * @param programId program id.
   * @param locationId location id.
   * @param options options to filter the restrictions.
   * - `restrictionCode` restriction code.
   * @returns effective institution restrictions.
   */
  getEffectiveInstitutionRestrictions(
    institutionId: number,
    programId: number,
    locationId: number,
    options?: { restrictionCode?: RestrictionCode },
  ): Promise<InstitutionRestriction[]> {
    const query = this.institutionRestrictionRepo
      .createQueryBuilder("institutionRestriction")
      .select([
        "institutionRestriction.id",
        "restriction.id",
        "restriction.restrictionCode",
      ])
      .innerJoin("institutionRestriction.restriction", "restriction")
      .where("institutionRestriction.isActive = TRUE")
      .andWhere("institutionRestriction.institutionId = :institutionId", {
        institutionId,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("institutionRestriction.program.id = :programId", {
            programId,
          }).orWhere("institutionRestriction.program.id IS NULL");
        }),
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where("institutionRestriction.location.id = :locationId", {
            locationId,
          }).orWhere("institutionRestriction.location.id IS NULL");
        }),
      );
    if (options?.restrictionCode) {
      query.andWhere("restriction.restrictionCode = :restrictionCode", {
        restrictionCode: options.restrictionCode,
      });
    }
    return query.getMany();
  }
}
