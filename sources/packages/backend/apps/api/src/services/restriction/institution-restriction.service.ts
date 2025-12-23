import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager, Equal, Not } from "typeorm";
import {
  RecordDataModelService,
  InstitutionRestriction,
  Restriction,
  User,
  Note,
  NoteType,
  Institution,
  EducationProgram,
  InstitutionLocation,
  RestrictionType,
  RestrictionNotificationType,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { RESTRICTION_NOT_ACTIVE } from "@sims/services/constants";
import { InstitutionService, RestrictionService } from "../../services";
import {
  INSTITUTION_NOT_FOUND,
  INSTITUTION_PROGRAM_LOCATION_ASSOCIATION_NOT_FOUND,
  INSTITUTION_RESTRICTION_ALREADY_ACTIVE,
  RESTRICTION_NOT_FOUND,
} from "../../constants";

/**
 * Service layer for institution Restriction.
 */
@Injectable()
export class InstitutionRestrictionService extends RecordDataModelService<InstitutionRestriction> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly institutionService: InstitutionService,
    private readonly restrictionService: RestrictionService,
  ) {
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
        "institutionRestrictions.resolvedAt",
        "institutionRestrictions.createdAt",
        "restriction.restrictionType",
        "restriction.restrictionCategory",
        "restriction.restrictionCode",
        "restriction.description",
        "location.name",
        "program.name",
      ])
      .innerJoin("institutionRestrictions.restriction", "restriction")
      .innerJoin("institutionRestrictions.institution", "institution")
      .innerJoin("institutionRestrictions.location", "location")
      .innerJoin("institutionRestrictions.program", "program")
      .where("institution.id = :institutionId", { institutionId })
      .orderBy("institutionRestrictions.isActive", "DESC")
      .addOrderBy("location.name", "ASC")
      .addOrderBy("program.name", "ASC")
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
   * @param restrictionId
   * @param noteDescription
   * @returns persisted institution restriction.
   */
  async addProvincialRestriction(
    institutionId: number,
    userId: number,
    restrictionId: number,
    noteDescription: string,
  ): Promise<InstitutionRestriction> {
    const institutionRestriction = new InstitutionRestriction();
    institutionRestriction.institution = { id: institutionId } as Institution;
    institutionRestriction.restriction = {
      id: restrictionId,
    } as Restriction;
    institutionRestriction.creator = { id: userId } as User;
    if (noteDescription) {
      institutionRestriction.restrictionNote = {
        description: noteDescription,
        noteType: NoteType.Restriction,
        creator: {
          id: institutionRestriction.creator.id,
        } as User,
      } as Note;
    }
    return this.repo.save(institutionRestriction);
  }

  /**
   * Creates a new institution restrictions.
   * @param institutionId ID of the institution to add a restriction.
   * @param restrictionId ID of the restriction to be assigned.
   * @param locationIds IDs of the locations to be assigned.
   * @param programId ID of the program to be assigned.
   * @param noteDescription Note description for the restriction assignment.
   * @param auditUserId ID of the user performing the action.
   * @returns Created institution restrictions.
   */
  async addInstitutionRestriction(
    institutionId: number,
    restrictionId: number,
    locationIds: number[],
    programId: number,
    noteDescription: string,
    auditUserId: number,
  ): Promise<InstitutionRestriction[]> {
    return this.dataSource.transaction(async (entityManager) => {
      const uniqueLocationIds = Array.from(new Set(locationIds));
      await this.validateInstitutionRestrictionCreation(
        institutionId,
        restrictionId,
        uniqueLocationIds,
        programId,
        entityManager,
      );
      // New note creation.
      const note = await this.institutionService.createInstitutionNote(
        institutionId,
        NoteType.Restriction,
        noteDescription,
        auditUserId,
        entityManager,
      );
      // New institution restriction creation.
      const newRestrictions = locationIds.map((locationId) => {
        const restriction = new InstitutionRestriction();
        restriction.institution = { id: institutionId } as Institution;
        restriction.restriction = { id: restrictionId } as Restriction;
        restriction.location = { id: locationId } as InstitutionLocation;
        restriction.program = { id: programId } as EducationProgram;
        restriction.creator = { id: auditUserId } as User;
        restriction.restrictionNote = note;
        restriction.isActive = true;
        return restriction;
      });
      await entityManager
        .getRepository(InstitutionRestriction)
        .insert(newRestrictions);
      return newRestrictions;
    });
  }

  /**
   * Execute validations for institution, location, program
   * association and restriction existence.
   * @param institutionId Institution ID.
   * @param restrictionId Restriction ID.
   * @param locationIds Location IDs. All locations must be associated with the institution
   * and all locations must not have the same restriction already active.
   * @param programId Program ID.
   * @param entityManager Entity manager for transaction.
   * @throws CustomNamedError when any of the validations fail.
   */
  private async validateInstitutionRestrictionCreation(
    institutionId: number,
    restrictionId: number,
    locationIds: number[],
    programId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    // Check institution, location, program association and institution restriction existence.
    // Execute left joins to allow the validations in a single query and the generation
    // of more precise error messages.
    const institutionPromise = entityManager
      .getRepository(Institution)
      .createQueryBuilder("institution")
      .select([
        "institution.id",
        "location.id",
        "program.id",
        "institutionRestriction.id",
      ])
      // Check if the location belongs to the institution.
      .leftJoin(
        "institution.locations",
        "location",
        "location.id IN (:...locationIds)",
        { locationIds },
      )
      // Check if the program belongs to the institution.
      .leftJoin("institution.programs", "program", "program.id = :programId", {
        programId,
      })
      // Check if an active restriction already exists for the institution.
      .leftJoin(
        "institution.restrictions",
        "institutionRestriction",
        "institutionRestriction.isActive = :isActive AND institutionRestriction.location.id IN (:...locationIds) AND institutionRestriction.program.id = :programId AND institutionRestriction.restriction.id = :restrictionId",
        { isActive: true, locationIds, programId, restrictionId },
      )
      .where("institution.id = :institutionId", { institutionId })
      .getOne();
    // Check the restriction existence.
    const restrictionExistsPromise = this.restrictionService.restrictionExists(
      restrictionId,
      RestrictionType.Institution,
      { entityManager },
    );
    const [institution, restrictionExists] = await Promise.all([
      institutionPromise,
      restrictionExistsPromise,
    ]);
    // Execute validations inspecting the results of the above queries.
    if (!institution) {
      throw new CustomNamedError(
        `Institution ID ${institutionId} not found.`,
        INSTITUTION_NOT_FOUND,
      );
    }
    if (institution.restrictions.length > 0) {
      throw new CustomNamedError(
        `The restriction ID ${restrictionId} is already assigned and active to the institution, program ID ${programId}, and at least one of the location ID(s) ${locationIds}.`,
        INSTITUTION_RESTRICTION_ALREADY_ACTIVE,
      );
    }
    if (institution.locations.length !== locationIds.length) {
      throw new CustomNamedError(
        `At least one of the location ID(s) ${locationIds} were not associated with the institution.`,
        INSTITUTION_PROGRAM_LOCATION_ASSOCIATION_NOT_FOUND,
      );
    }
    if (!institution.programs.length) {
      throw new CustomNamedError(
        `The specified program ID ${programId} is not associated with the institution.`,
        INSTITUTION_PROGRAM_LOCATION_ASSOCIATION_NOT_FOUND,
      );
    }
    if (!restrictionExists) {
      throw new CustomNamedError(
        `Institution restriction ID ${restrictionId} not found.`,
        RESTRICTION_NOT_FOUND,
      );
    }
  }

  /**
   * Resolve provincial restriction.
   * @param institutionId
   * @param institutionRestrictionId
   * @param userId
   * @param noteDescription
   * @returns resolved institution restriction.
   */
  async resolveProvincialRestriction(
    institutionId: number,
    institutionRestrictionId: number,
    userId: number,
    noteDescription: string,
  ): Promise<InstitutionRestriction> {
    const institutionRestrictionEntity = await this.repo.findOne({
      where: {
        id: institutionRestrictionId,
        institution: { id: institutionId },
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

    const now = new Date();
    institutionRestrictionEntity.isActive = false;
    institutionRestrictionEntity.modifier = { id: userId } as User;
    institutionRestrictionEntity.updatedAt = now;
    institutionRestrictionEntity.resolutionNote = {
      description: noteDescription,
      noteType: NoteType.Restriction,
      creator: {
        id: institutionRestrictionEntity.modifier.id,
      } as User,
      createdAt: now,
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

  /**
   * Get institution restrictions by location and program.
   * @param locationId institution location.
   * @param programId institution program.
   * @param options Options.
   * - `isActive` Indicates whether to select only active restrictions.
   * - `excludeNoEffectRestrictions` Indicates whether to exclude restrictions with no effect.
   * @returns Institution restrictions.
   */
  async getInstitutionRestrictionsByLocationAndProgram(
    locationId: number,
    programId: number,
    options?: { isActive?: boolean; excludeNoEffectRestrictions?: boolean },
  ): Promise<InstitutionRestriction[]> {
    return this.repo.find({
      select: {
        id: true,
        restriction: {
          id: true,
          actionType: true,
        },
      },
      relations: {
        restriction: true,
      },
      where: {
        location: { id: locationId },
        program: { id: programId },
        restriction: {
          notificationType: options?.excludeNoEffectRestrictions
            ? Not(Equal(RestrictionNotificationType.NoEffect))
            : undefined,
        },
        isActive: options?.isActive,
      },
    });
  }
}
