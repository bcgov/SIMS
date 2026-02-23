import { Injectable } from "@nestjs/common";
import {
  DataSource,
  EntityManager,
  Equal,
  Not,
  SelectQueryBuilder,
} from "typeorm";
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
  RestrictionNotificationType,
  RestrictionType,
} from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import {
  FIELD_REQUIREMENTS_NOT_VALID,
  INSTITUTION_NOT_FOUND,
  INSTITUTION_PROGRAM_LOCATION_ASSOCIATION_NOT_FOUND,
  INSTITUTION_RESTRICTION_ALREADY_ACTIVE,
  RESTRICTION_NOT_ACTIVE,
  RESTRICTION_NOT_FOUND,
} from "../../constants";
import { NoteSharedService } from "@sims/services";
import { CreateInstitutionRestrictionModel } from "./models/institution-restriction.model";
import { validateFieldRequirements } from "../../utilities";

/**
 * Service layer for institution Restriction.
 */
@Injectable()
export class InstitutionRestrictionService extends RecordDataModelService<InstitutionRestriction> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly noteSharedService: NoteSharedService,
  ) {
    super(dataSource.getRepository(InstitutionRestriction));
  }

  /**
   * Get institution restrictions.
   * @param institutionId institution id.
   * @param options Options.
   * - `isActive` indicates whether to select only active restrictions.
   * - `locationIds` location ids.
   * - `excludeNoEffectRestrictions` indicates whether to exclude restrictions with no effect.
   * @returns Institution restrictions.
   */
  async getInstitutionRestrictions(
    institutionId: number,
    options?: {
      isActive?: boolean;
      locationIds?: number[];
      excludeNoEffectRestrictions?: boolean;
    },
  ): Promise<InstitutionRestriction[]> {
    const restrictionsQuery = this.repo
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
        "restriction.actionType",
        "location.id",
        "location.name",
        "program.id",
        "program.name",
      ])
      .innerJoin("institutionRestrictions.restriction", "restriction")
      .innerJoin("institutionRestrictions.institution", "institution")
      .innerJoin("institutionRestrictions.location", "location")
      .innerJoin("institutionRestrictions.program", "program")
      .where("institution.id = :institutionId", { institutionId });
    if (options?.isActive !== undefined && options.isActive !== null) {
      restrictionsQuery.andWhere(
        "institutionRestrictions.isActive = :isActive",
        { isActive: options.isActive },
      );
    }
    if (options?.locationIds?.length) {
      restrictionsQuery.andWhere("location.id IN (:...locationIds)", {
        locationIds: options.locationIds,
      });
    }
    if (options?.excludeNoEffectRestrictions) {
      restrictionsQuery.andWhere(
        "restriction.notificationType != :noEffectNotificationType",
        { noEffectNotificationType: RestrictionNotificationType.NoEffect },
      );
    }
    return restrictionsQuery
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
    institutionRestriction: CreateInstitutionRestrictionModel,
    auditUserId: number,
  ): Promise<InstitutionRestriction[]> {
    return this.dataSource.transaction(async (entityManager) => {
      const uniqueLocationIds = Array.from(
        new Set(institutionRestriction.locationIds ?? []),
      );
      await this.validateInstitutionRestrictionCreation(
        institutionId,
        institutionRestriction.restrictionId,
        institutionRestriction.programId,
        uniqueLocationIds,
        entityManager,
      );
      // New note creation.
      const note = await this.noteSharedService.createInstitutionNote(
        institutionId,
        NoteType.Restriction,
        institutionRestriction.noteDescription,
        auditUserId,
        entityManager,
      );
      // If the restriction is not applicable to locations, create a single institution restriction
      // without location.
      const locationsToCreateRestriction = uniqueLocationIds.length
        ? uniqueLocationIds
        : [null];
      // New institution restriction creation.
      const newRestrictions = locationsToCreateRestriction.map((locationId) => {
        const restriction = new InstitutionRestriction();
        restriction.institution = { id: institutionId } as Institution;
        restriction.restriction = {
          id: institutionRestriction.restrictionId,
        } as Restriction;
        restriction.location = locationId
          ? ({ id: locationId } as InstitutionLocation)
          : null;
        restriction.program = institutionRestriction.programId
          ? ({
              id: institutionRestriction.programId,
            } as EducationProgram)
          : null;
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
    programId: number | undefined,
    locationIds: number[] | undefined,
    entityManager: EntityManager,
  ): Promise<void> {
    const hasProgram = !!programId;
    const hasLocations = !!locationIds?.length;
    // Check institution, location, program association and institution restriction existence.
    // Execute left joins to allow the validations in a single query and the generation
    // of more precise error messages.
    const institutionPromise = this.buildValidationQuery(
      hasProgram,
      hasLocations,
      entityManager,
    )
      .where("institution.id = :institutionId", { institutionId })
      .setParameters({ institutionId, restrictionId, programId, locationIds })
      .getOne();
    const restrictionPromise = this.getRestriction(restrictionId, {
      entityManager,
    });
    const [institution, restriction] = await Promise.all([
      institutionPromise,
      restrictionPromise,
    ]);
    // Execute validations inspecting the results of the above queries.
    if (!institution) {
      throw new CustomNamedError(
        `Institution ID ${institutionId} not found.`,
        INSTITUTION_NOT_FOUND,
      );
    }
    if (!restriction) {
      throw new CustomNamedError(
        `Restriction ID ${restrictionId} not found or invalid.`,
        RESTRICTION_NOT_FOUND,
      );
    }
    if (institution.restrictions.length > 0) {
      throw new CustomNamedError(
        `The restriction ID ${restrictionId} is already assigned and active to the institution${hasProgram ? `, program ID ${programId}` : ""}${hasLocations ? `, and at least one of the location ID(s) ${locationIds}` : ""}.`,
        INSTITUTION_RESTRICTION_ALREADY_ACTIVE,
      );
    }
    if (hasLocations && institution.locations.length !== locationIds.length) {
      throw new CustomNamedError(
        `At least one of the location ID(s) ${locationIds} were not associated with the institution.`,
        INSTITUTION_PROGRAM_LOCATION_ASSOCIATION_NOT_FOUND,
      );
    }
    if (hasProgram && !institution.programs.length) {
      throw new CustomNamedError(
        `The specified program ID ${programId} is not associated with the institution.`,
        INSTITUTION_PROGRAM_LOCATION_ASSOCIATION_NOT_FOUND,
      );
    }
    const fieldValidationResult = validateFieldRequirements(
      new Map<string, unknown>([
        ["program", programId],
        ["location", locationIds],
      ]),
      restriction.metadata.fieldRequirements,
    );
    if (!fieldValidationResult.isValid) {
      throw new CustomNamedError(
        `Field requirement error(s): ${fieldValidationResult.errorMessages.join(", ")}.`,
        FIELD_REQUIREMENTS_NOT_VALID,
      );
    }
  }

  /**
   * Resolve an institution restriction.
   * @param institutionId institution id.
   * @param institutionRestrictionId institution restriction id.
   * @param userId user id.
   * @param noteDescription note description.
   */
  async resolveInstitutionRestriction(
    institutionId: number,
    institutionRestrictionId: number,
    userId: number,
    noteDescription: string,
  ): Promise<void> {
    const institutionRestrictionEntity = await this.repo.findOne({
      select: { id: true, isActive: true },
      where: {
        id: institutionRestrictionId,
        institution: { id: institutionId },
      },
    });
    if (!institutionRestrictionEntity) {
      throw new CustomNamedError(
        "The restriction for the institution was not found.",
        RESTRICTION_NOT_FOUND,
      );
    }
    if (!institutionRestrictionEntity.isActive) {
      throw new CustomNamedError(
        "The restriction is already resolved.",
        RESTRICTION_NOT_ACTIVE,
      );
    }
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      const note = await this.noteSharedService.createInstitutionNote(
        institutionId,
        NoteType.Restriction,
        noteDescription,
        userId,
        transactionalEntityManager,
      );
      const now = new Date();
      const auditUser = { id: userId } as User;
      const institutionRestriction = new InstitutionRestriction();
      institutionRestriction.id = institutionRestrictionId;
      institutionRestriction.modifier = auditUser;
      institutionRestriction.updatedAt = now;
      institutionRestriction.isActive = false;
      institutionRestriction.resolutionNote = note;
      institutionRestriction.resolvedBy = auditUser;
      institutionRestriction.resolvedAt = now;
      await transactionalEntityManager
        .getRepository(InstitutionRestriction)
        .save(institutionRestriction);
    });
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
   * @param locationId Institution location.
   * @param programId Institution program.
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

  /**
   * Get restriction of type Institution by id.
   * @param restrictionId restriction id.
   * @param options options.
   * - `entityManager` Entity manager to execute in transaction.
   * @returns restriction.
   */
  private async getRestriction(
    restrictionId: number,
    options?: { entityManager?: EntityManager },
  ): Promise<Restriction> {
    const repo =
      options?.entityManager?.getRepository(Restriction) ??
      this.dataSource.getRepository(Restriction);
    return repo.findOne({
      select: { id: true, metadata: true },
      where: {
        id: restrictionId,
        restrictionType: RestrictionType.Institution,
      },
    });
  }

  /**
   * Build the restriction validation query based on the existence of location and program criteria.
   * @param hasProgram Indicates whether the restriction is applicable to a program.
   * @param hasLocations Indicates whether the restriction is applicable to one or more locations.
   * @param entityManager The entity manager to use for the query.
   * @returns The query builder for the institution restriction validation.
   */
  private buildValidationQuery(
    hasProgram: boolean,
    hasLocations: boolean,
    entityManager: EntityManager,
  ): SelectQueryBuilder<Institution> {
    const query = entityManager
      .getRepository(Institution)
      .createQueryBuilder("institution")
      .select(["institution.id", "institutionRestriction.id"]);
    if (hasLocations) {
      query
        .addSelect("location.id")
        .leftJoin(
          "institution.locations",
          "location",
          "location.id IN (:...locationIds)",
        );
    }
    if (hasProgram) {
      query
        .addSelect("program.id")
        .leftJoin("institution.programs", "program", "program.id = :programId");
    }
    // Build institution restriction criteria to validate
    // if there is an active institution restriction for the same program and location combination.
    const institutionRestrictionCriteria: string[] = [];
    institutionRestrictionCriteria.push(
      "institutionRestriction.isActive = TRUE AND institutionRestriction.restriction.id = :restrictionId",
    );
    // Program join criteria.
    institutionRestrictionCriteria.push(
      hasProgram
        ? "institutionRestriction.program.id = :programId"
        : "institutionRestriction.program.id IS NULL",
    );
    // Location join criteria.
    institutionRestrictionCriteria.push(
      hasLocations
        ? "institutionRestriction.location.id IN (:...locationIds)"
        : "institutionRestriction.location.id IS NULL",
    );
    query.leftJoin(
      "institution.restrictions",
      "institutionRestriction",
      institutionRestrictionCriteria.join(" AND "),
    );
    return query;
  }
}
