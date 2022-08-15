import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { DataSource } from "typeorm";
import { RESTRICTION_NOT_ACTIVE } from "./student-restriction.service";

import {
  InstitutionRestriction,
  Restriction,
  User,
  Note,
  NoteType,
  Institution,
} from "../../database/entities";
import {
  AssignRestrictionAPIInDTO,
  ResolveRestrictionAPIInDTO,
} from "../../route-controllers/restriction/models/restriction.dto";
import { CustomNamedError } from "../../utilities";

/**
 * Service layer for institution Restriction.
 */
@Injectable()
export class InstitutionRestrictionService extends RecordDataModelService<InstitutionRestriction> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(InstitutionRestriction));
  }

  /**
   * Service method to get all restrictions as a summary for an institution.
   * @param institutionId
   * @returns Institution restrictions.
   */
  async getInstitutionRestrictionsById(
    institutionId: number,
  ): Promise<InstitutionRestriction[]> {
    return this.repo
      .createQueryBuilder("institutionRestrictions")
      .select([
        "institutionRestrictions.id",
        "institutionRestrictions.isActive",
        "institutionRestrictions.updatedAt",
        "institutionRestrictions.createdAt",
        "restriction.restrictionType",
        "restriction.restrictionCategory",
        "restriction.restrictionCode",
        "restriction.description",
      ])
      .innerJoin("institutionRestrictions.restriction", "restriction")
      .innerJoin("institutionRestrictions.institution", "institution")
      .where("institution.id = :institutionId", { institutionId })
      .orderBy("institutionRestrictions.isActive", "DESC")
      .getMany();
  }

  /**
   * Get institution restriction detail.
   * @param institutionId
   * @param restrictionId
   * @returns
   */
  async getInstitutionRestrictionDetailsById(
    institutionId: number,
    institutionRestrictionId: number,
  ): Promise<InstitutionRestriction> {
    return this.repo
      .createQueryBuilder("institutionRestrictions")
      .select([
        "institutionRestrictions.id",
        "institutionRestrictions.isActive",
        "institutionRestrictions.updatedAt",
        "institutionRestrictions.createdAt",
        "creator.firstName",
        "creator.lastName",
        "modifier.firstName",
        "modifier.lastName",
        "restriction.restrictionType",
        "restriction.restrictionCategory",
        "restriction.restrictionCode",
        "restriction.description",
        "restrictionNote.description",
        "resolutionNote.description",
      ])
      .innerJoin("institutionRestrictions.restriction", "restriction")
      .leftJoin("institutionRestrictions.creator", "creator")
      .leftJoin("institutionRestrictions.modifier", "modifier")
      .innerJoin("institutionRestrictions.institution", "institution")
      .leftJoin("institutionRestrictions.restrictionNote", "restrictionNote")
      .leftJoin("institutionRestrictions.resolutionNote", "resolutionNote")
      .where("institution.id = :institutionId", { institutionId })
      .andWhere("institutionRestrictions.id = :institutionRestrictionId", {
        institutionRestrictionId,
      })
      .getOne();
  }

  /**
   * Add provincial restriction to institution.
   * @param institutionId
   * @param userId
   * @param assignRestrictionDTO
   * @returns persisted institution restriction.
   */
  async addProvincialRestriction(
    institutionId: number,
    userId: number,
    assignRestrictionDTO: AssignRestrictionAPIInDTO,
  ): Promise<InstitutionRestriction> {
    const institutionRestriction = new InstitutionRestriction();
    institutionRestriction.institution = { id: institutionId } as Institution;
    institutionRestriction.restriction = {
      id: assignRestrictionDTO.restrictionId,
    } as Restriction;
    institutionRestriction.creator = { id: userId } as User;
    if (assignRestrictionDTO.noteDescription) {
      institutionRestriction.restrictionNote = {
        description: assignRestrictionDTO.noteDescription,
        noteType: NoteType.Restriction,
        creator: {
          id: institutionRestriction.creator.id,
        } as User,
      } as Note;
    }
    return this.repo.save(institutionRestriction);
  }

  /**
   * Resolve provincial restriction.
   * @param institutionId
   * @param institutionRestrictionId
   * @param userId
   * @param resolveRestrictionDTO
   * @returns resolved institution restriction.
   */
  async resolveProvincialRestriction(
    institutionId: number,
    institutionRestrictionId: number,
    userId: number,
    resolveRestrictionDTO: ResolveRestrictionAPIInDTO,
  ): Promise<InstitutionRestriction> {
    const institutionRestrictionEntity = await this.repo.findOne({
      where: {
        id: institutionRestrictionId,
        institution: { id: institutionId } as Institution,
        isActive: true,
      },
      relations: { resolutionNote: true, modifier: true, restriction: true },
    });

    if (!institutionRestrictionEntity) {
      throw new CustomNamedError(
        "The restriction neither assigned to institution nor active. Only active restrictions can be resolved.",
        RESTRICTION_NOT_ACTIVE,
      );
    }

    institutionRestrictionEntity.isActive = false;
    institutionRestrictionEntity.modifier = { id: userId } as User;
    institutionRestrictionEntity.resolutionNote = {
      description: resolveRestrictionDTO.noteDescription,
      noteType: NoteType.Restriction,
      creator: {
        id: institutionRestrictionEntity.modifier.id,
      } as User,
    } as Note;
    return this.repo.save(institutionRestrictionEntity);
  }

  /**
   * Service method to find if Institution has any restriction institution.
   * TODO: Removed .having("count(*) > restriction.allowedCount"), which may cause unexpected results, need to adjust the logic.
   * @param institutionId
   * @returns Institution restriction.
   */
  async getRestrictionStatusById(
    institutionId: number,
  ): Promise<InstitutionRestriction[]> {
    return this.repo
      .createQueryBuilder("institutionRestrictions")
      .select("restriction.id")
      .addSelect("count(*)", "restrictionCount")
      .innerJoin("institutionRestrictions.restriction", "restriction")
      .innerJoin("institutionRestrictions.institution", "institution")
      .where("institution.id = :institutionId", { institutionId })
      .andWhere("institutionRestrictions.isActive = true")
      .groupBy("institutionRestrictions.institution.id")
      .addGroupBy("restriction.id")
      .getRawMany();
  }
}
