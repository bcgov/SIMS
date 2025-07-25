import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  EducationProgram,
  EducationProgramOffering,
  Institution,
  Note,
  NoteType,
  OfferingTypes,
  User,
  ProgramStatus,
  ProgramYear,
  InstitutionLocation,
  getRawCount,
  ProgramIntensity,
} from "@sims/sims-db";
import {
  DataSource,
  In,
  Repository,
  Not,
  Equal,
  UpdateResult,
  EntityManager,
  MoreThan,
  IsNull,
  Brackets,
  Or,
  SelectQueryBuilder,
} from "typeorm";
import {
  SaveEducationProgram,
  EducationProgramsSummary,
} from "./education-program.service.models";
import {
  sortProgramsColumnMap,
  PaginatedResults,
  SortPriority,
  ProgramPaginationOptions,
  PaginationOptions,
} from "../../utilities";
import {
  CustomNamedError,
  getISODateOnlyString,
  isSameOrAfterDate,
} from "@sims/utilities";
import {
  EDUCATION_PROGRAM_NOT_FOUND,
  DUPLICATE_SABC_CODE,
  EDUCATION_PROGRAM_INVALID_OPERATION,
} from "../../constants";
import {
  InstitutionService,
  EducationProgramOfferingService,
} from "../../services";
import {
  InstitutionAddsPendingProgramNotification,
  NotificationActionsService,
} from "@sims/services";
import {
  INACTIVE_PROGRAM,
  OTHER_REGULATORY_BODY,
} from "../education-program/constants";

@Injectable()
export class EducationProgramService extends RecordDataModelService<EducationProgram> {
  private readonly offeringsRepo: Repository<EducationProgramOffering>;
  constructor(
    private readonly dataSource: DataSource,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
    private readonly institutionService: InstitutionService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super(dataSource.getRepository(EducationProgram));
    this.offeringsRepo = dataSource.getRepository(EducationProgramOffering);
  }

  /**
   * Gets a program and optionally ensures that this program belongs
   * to the expected institution including the institution
   * id in the query.
   * @param programId program id.
   * @param institutionId expected institution id.
   * @returns education program.
   */
  async getInstitutionProgram(
    programId: number,
    institutionId?: number,
  ): Promise<EducationProgram> {
    return this.repo.findOne({
      select: {
        id: true,
        isActive: true,
        effectiveEndDate: true,
        institution: { id: true },
      },
      relations: {
        institution: true,
      },
      where: {
        id: programId,
        institution: { id: institutionId },
      },
    });
  }

  /**
   * Gets a program details for a student
   * This returns only a subset of the educationProgram
   * id in the query.
   * @param programId Program id.
   * @returns program
   */
  async getStudentEducationProgram(
    programId: number,
  ): Promise<EducationProgram> {
    return this.repo
      .createQueryBuilder("programs")
      .select([
        "programs.id",
        "programs.name",
        "programs.description",
        "programs.credentialType",
        "programs.deliveredOnSite",
        "programs.deliveredOnline",
      ])
      .where("programs.id = :programId", { programId })
      .andWhere("programs.programStatus = :programStatus", {
        programStatus: ProgramStatus.Approved,
      })
      .getOne();
  }

  /**
   * Inserts/updates an education program at institution level that will be available for all
   * locations and saves a notification to the ministry as a part of the same transaction.
   * @param programId if provided will update the record, otherwise will insert a new one.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param educationProgram Information used to save the program.
   * @returns Education program created/updated.
   */
  async saveEducationProgram(
    institutionId: number,
    auditUserId: number,
    educationProgram: SaveEducationProgram,
    programId?: number,
  ): Promise<EducationProgram> {
    let hasExistingOffering = false;
    let program = new EducationProgram();
    if (programId) {
      // Ensures that the user has access to the institution associated with the program id being updated.
      program = await this.getInstitutionProgram(programId, institutionId);
      if (!program) {
        throw new CustomNamedError(
          "Not able to find the education program.",
          EDUCATION_PROGRAM_NOT_FOUND,
        );
      }
      if (!program.isActive) {
        throw new CustomNamedError(
          "Education program cannot be edited when inactive.",
          EDUCATION_PROGRAM_INVALID_OPERATION,
        );
      }
      if (program.isExpired) {
        throw new CustomNamedError(
          "Education program cannot be edited when expired.",
          EDUCATION_PROGRAM_INVALID_OPERATION,
        );
      }
      // Check if education program has offering(s). This check is required to
      // prevent a user from updating fields that are not supposed
      // to be updated if the education program has 1 or more offerings.
      hasExistingOffering =
        await this.educationProgramOfferingService.hasExistingOffering(
          programId,
        );
    }

    if (educationProgram.sabcCode) {
      const isSABCCodeDuplicate = await this.hasExistingProgramWithSameSABCCode(
        institutionId,
        educationProgram.sabcCode,
        programId,
      );
      if (isSABCCodeDuplicate) {
        throw new CustomNamedError("Duplicate SABC code.", DUPLICATE_SABC_CODE);
      }
    }

    // Assign attributes for update from payload only if existing program has no offering(s).
    if (!hasExistingOffering) {
      program.fieldOfStudyCode = educationProgram.fieldOfStudyCode;
      program.credentialType = educationProgram.credentialType;
      program.cipCode = educationProgram.cipCode;
      program.nocCode = educationProgram.nocCode;
      // Save SABC code as null in case of not answered in the form.
      // This way it can be saved when multiple programs does not have a SABC code.
      program.sabcCode = educationProgram.sabcCode?.trim() || null;
      program.regulatoryBody = educationProgram.regulatoryBody;
      program.otherRegulatoryBody =
        educationProgram.regulatoryBody === OTHER_REGULATORY_BODY
          ? educationProgram.otherRegulatoryBody
          : null;
      program.deliveredOnSite =
        educationProgram.programDeliveryTypes.deliveredOnSite ?? false;
      program.deliveredOnline =
        educationProgram.programDeliveryTypes.deliveredOnline ?? false;
      program.deliveredOnlineAlsoOnsite =
        educationProgram.deliveredOnlineAlsoOnsite;
      program.sameOnlineCreditsEarned =
        educationProgram.sameOnlineCreditsEarned;
      program.earnAcademicCreditsOtherInstitution =
        educationProgram.earnAcademicCreditsOtherInstitution;
      program.courseLoadCalculation = educationProgram.courseLoadCalculation;
      program.completionYears = educationProgram.completionYears;
      program.hasMinimumAge =
        educationProgram.entranceRequirements.hasMinimumAge;
      program.eslEligibility = educationProgram.eslEligibility;
      program.hasJointInstitution = educationProgram.hasJointInstitution;
      program.hasJointDesignatedInstitution =
        educationProgram.hasJointDesignatedInstitution;
      program.programStatus = educationProgram.programStatus;
      program.programIntensity = educationProgram.programIntensity;
      program.institutionProgramCode = educationProgram.institutionProgramCode;
      program.minHoursWeek = educationProgram.minHoursWeek;
      program.isAviationProgram = educationProgram.isAviationProgram;
      program.credentialTypesAviation =
        educationProgram.credentialTypesAviation;
      program.minHoursWeekAvi = educationProgram.minHoursWeekAvi;
      program.minHighSchool =
        educationProgram.entranceRequirements.minHighSchool;
      program.requirementsByInstitution =
        educationProgram.entranceRequirements.requirementsByInstitution;
      program.requirementsByBCITA =
        educationProgram.entranceRequirements.requirementsByBCITA;
      program.noneOfTheAboveEntranceRequirements =
        educationProgram.entranceRequirements.noneOfTheAboveEntranceRequirements;
      program.hasWILComponent = educationProgram.hasWILComponent;
      program.isWILApproved = educationProgram.isWILApproved;
      program.wilProgramEligibility = educationProgram.wilProgramEligibility;
      program.hasTravel = educationProgram.hasTravel;
      program.travelProgramEligibility =
        educationProgram.travelProgramEligibility;
      program.hasIntlExchange = educationProgram.hasIntlExchange;
      program.intlExchangeProgramEligibility =
        educationProgram.intlExchangeProgramEligibility;
      program.programDeclaration = educationProgram.programDeclaration;
    }
    program.id = programId;
    program.name = educationProgram.name;
    program.description = educationProgram.description;
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    if (!programId) {
      // Institution should never be updated after creation.
      program.institution = { id: institutionId } as Institution;
      program.submittedBy = auditUser;
      program.submittedDate = now;
      program.creator = auditUser;
      program.createdAt = now;
    } else {
      program.modifier = auditUser;
    }
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      await this.saveInstitutionAddsPendingProgramNotification(
        { name: program.name, programStatus: program.programStatus },
        institutionId,
        transactionalEntityManager,
      );
      return transactionalEntityManager
        .getRepository(EducationProgram)
        .save(program);
    });
  }

  /**
   * Gets all the programs that are associated with an institution
   * alongside with the total of offerings on locations.
   * @param institutionId id of the institution.
   * @param offeringTypes offering types.
   * @param paginationOptions program related pagination options.
   * @returns paginated summary for the institution.
   */
  async getProgramsSummary(
    institutionId: number,
    offeringTypes: OfferingTypes[],
    paginationOptions: ProgramPaginationOptions,
  ): Promise<PaginatedResults<EducationProgramsSummary>> {
    // When both the status search and inactive search is false, nothing is returned.
    if (
      !paginationOptions.statusSearch &&
      !paginationOptions.inactiveProgramSearch
    ) {
      return {
        results: [],
        count: 0,
      };
    }
    const { programQuery, queryParams } = this.getProgramsQueryWithQueryParams(
      offeringTypes,
      institutionId,
    );
    // Program name search.
    if (paginationOptions.programNameSearch) {
      programQuery.andWhere("programs.name Ilike :programNameSearchCriteria", {
        programNameSearchCriteria: `%${paginationOptions.programNameSearch}%`,
      });
      queryParams.push(`%${paginationOptions.programNameSearch}%`);
    }
    // Location name search.
    if (paginationOptions.locationNameSearch) {
      programQuery.andWhere("location.name Ilike :locationNameSearchCriteria", {
        locationNameSearchCriteria: `%${paginationOptions.locationNameSearch}%`,
      });
      queryParams.push(`%${paginationOptions.locationNameSearch}%`);
    }
    // When the status search and inactive both are true,
    // then fetch the inactive programs along with the ones
    // from the program status list.
    if (
      paginationOptions.statusSearch &&
      paginationOptions.inactiveProgramSearch
    ) {
      programQuery.andWhere(
        new Brackets((qb) =>
          qb
            .where(
              "programs.programStatus IN (:...programStatusSearchCriteria)",
              {
                programStatusSearchCriteria: paginationOptions.statusSearch,
              },
            )
            .orWhere("programs.isActive = :programIsActiveSearchCriteria", {
              programIsActiveSearchCriteria:
                !paginationOptions.inactiveProgramSearch,
            })
            .orWhere(
              "programs.effectiveEndDate is not null and programs.effectiveEndDate <= CURRENT_DATE",
            ),
        ),
      );
      queryParams.push(...paginationOptions.statusSearch);
      queryParams.push(!paginationOptions.inactiveProgramSearch);
    }
    // Fetching only the active programs with the provided program status.
    else if (paginationOptions.statusSearch) {
      programQuery.andWhere(
        "programs.programStatus IN (:...programStatusSearchCriteria) and programs.isActive = true and (programs.effectiveEndDate is null OR programs.effectiveEndDate > CURRENT_DATE)",
        {
          programStatusSearchCriteria: paginationOptions.statusSearch,
        },
      );
      queryParams.push(...paginationOptions.statusSearch);
    }
    // Fetching only the inactive status programs.
    else if (paginationOptions.inactiveProgramSearch) {
      programQuery.andWhere(
        new Brackets((qb) => {
          qb.where("programs.isActive = :programIsActiveSearchCriteria", {
            programIsActiveSearchCriteria:
              !paginationOptions.inactiveProgramSearch,
          }).orWhere(
            "programs.effectiveEndDate is not null and programs.effectiveEndDate <= CURRENT_DATE",
          );
        }),
      );
      queryParams.push(!paginationOptions.inactiveProgramSearch);
    }

    return this.preparePaginatedProgramQuery(
      programQuery,
      paginationOptions,
      queryParams,
    );
  }

  /**
   * Gets all the programs that are associated with
   * an institution and the location alongside with
   * the total of offerings on locations.
   * @param institutionId id of the institution.
   * @param offeringTypes offering types.
   * @param paginationOptions pagination options.
   * @param locationId related location id.
   * @returns paginated summary for the institution location.
   */
  async getProgramsSummaryForLocation(
    institutionId: number,
    offeringTypes: OfferingTypes[],
    paginationOptions: PaginationOptions,
    locationId: number,
  ): Promise<PaginatedResults<EducationProgramsSummary>> {
    const { programQuery, queryParams } = this.getProgramsQueryWithQueryParams(
      offeringTypes,
      institutionId,
    );
    if (locationId) {
      queryParams.push(locationId);
      programQuery.andWhere("location.id = :locationId", {
        locationId,
      });
    }
    if (paginationOptions.searchCriteria) {
      programQuery.andWhere("programs.name Ilike :searchCriteria", {
        searchCriteria: `%${paginationOptions.searchCriteria}%`,
      });
      queryParams.push(`%${paginationOptions.searchCriteria}%`);
    }
    return this.preparePaginatedProgramQuery(
      programQuery,
      paginationOptions,
      queryParams,
    );
  }

  /**
   * Get programs that have at least one offering
   * for a particular location.
   * @param locationId id of the location that should have the
   * offering associated with.
   * @param programYearId program year id.
   * @param isFulltimeAllowed is fulltime allowed.
   * @param includeInActivePY includeInActivePY, if includeInActivePY, then both active
   * and not active program year is considered.
   * @returns programs with offerings under the specified location.
   */
  async getProgramsForLocation(
    locationId: number,
    programYearId: number,
    isFulltimeAllowed: boolean,
    includeInActivePY?: boolean,
  ): Promise<Partial<EducationProgram>[]> {
    const offeringExistsQuery = this.offeringsRepo
      .createQueryBuilder("offerings")
      .innerJoin(ProgramYear, "programYear", "programYear.id = :programYearId")
      .where("offerings.educationProgram.id = programs.id")
      .andWhere("offerings.institutionLocation.id = :locationId")
      .andWhere(
        "offerings.studyStartDate BETWEEN programYear.startDate AND programYear.endDate",
      );
    if (!includeInActivePY) {
      offeringExistsQuery.andWhere("programYear.active = true");
    }
    offeringExistsQuery.select("1");
    const programsQuery = this.repo
      .createQueryBuilder("programs")
      .where("programs.programStatus = :programStatus", {
        programStatus: ProgramStatus.Approved,
      })
      .andWhere("programs.isActive = true")
      .andWhere(
        new Brackets((qb) => {
          qb.where("programs.effectiveEndDate is null").orWhere(
            "programs.effectiveEndDate > CURRENT_DATE",
          );
        }),
      );
    if (!isFulltimeAllowed) {
      programsQuery.andWhere("programs.programIntensity = :programIntensity", {
        programIntensity: ProgramIntensity.fullTimePartTime,
      });
    }
    return programsQuery
      .andWhere(`exists(${offeringExistsQuery.getQuery()})`)
      .select("programs.id")
      .addSelect("programs.name")
      .setParameters({ locationId, programYearId })
      .orderBy("programs.name")
      .getMany();
  }

  /**
   * Get programs for a particular institution.
   * @param institutionId id of the institution.
   * @param options method options:
   * - `isIncludeInActiveProgram`: if isIncludeInActiveProgram, then both active
   * and not active education program is considered.
   * @returns programs under the specified institution.
   */
  async getPrograms(
    institutionId: number,
    options?: { isIncludeInActiveProgram?: boolean },
  ): Promise<Partial<EducationProgram>[]> {
    const query = this.repo
      .createQueryBuilder("programs")
      .select(["programs.id", "programs.name"])
      .where("programs.programStatus = :programStatus", {
        programStatus: ProgramStatus.Approved,
      })
      .andWhere("programs.institution.id = :institutionId", { institutionId });
    if (!options?.isIncludeInActiveProgram) {
      query.andWhere("programs.isActive = true").andWhere(
        new Brackets((qb) => {
          qb.where("programs.effectiveEndDate is null").orWhere(
            "programs.effectiveEndDate > CURRENT_DATE",
          );
        }),
      );
    }
    return query.orderBy("programs.name").getMany();
  }

  /**
   * Gets program details with program id.
   * @param programId Program id.
   * @param institutionId when provided, ensures the proper authorization
   * checking if the institution has access to the program.
   * @returns education program.
   */
  async getEducationProgramDetails(
    programId: number,
    institutionId?: number,
  ): Promise<EducationProgram> {
    const query = this.repo
      .createQueryBuilder("programs")
      .select([
        "programs.id",
        "programs.name",
        "programs.description",
        "programs.credentialType",
        "programs.cipCode",
        "programs.nocCode",
        "programs.sabcCode",
        "programs.programStatus",
        "programs.programIntensity",
        "programs.institutionProgramCode",
        "programs.regulatoryBody",
        "programs.otherRegulatoryBody",
        "programs.deliveredOnSite",
        "programs.deliveredOnline",
        "programs.deliveredOnlineAlsoOnsite",
        "programs.sameOnlineCreditsEarned",
        "programs.earnAcademicCreditsOtherInstitution",
        "programs.courseLoadCalculation",
        "programs.completionYears",
        "programs.eslEligibility",
        "programs.hasJointInstitution",
        "programs.hasJointDesignatedInstitution",
        "programs.institutionProgramCode",
        "programs.minHoursWeek",
        "programs.isAviationProgram",
        "programs.credentialTypesAviation",
        "programs.minHoursWeekAvi",
        "programs.hasMinimumAge",
        "programs.minHighSchool",
        "programs.requirementsByInstitution",
        "programs.requirementsByBCITA",
        "programs.noneOfTheAboveEntranceRequirements",
        "programs.hasWILComponent",
        "programs.isWILApproved",
        "programs.wilProgramEligibility",
        "programs.hasTravel",
        "programs.travelProgramEligibility",
        "programs.hasIntlExchange",
        "programs.intlExchangeProgramEligibility",
        "programs.programDeclaration",
        "institution.id",
        "institution.legalOperatingName",
        "institution.operatingName",
        "institutionType.id",
        "programs.submittedDate",
        "submittedBy.firstName",
        "submittedBy.lastName",
        "assessedBy.firstName",
        "assessedBy.lastName",
        "programs.assessedDate",
        "programs.effectiveEndDate",
        "programs.isActive",
      ])
      .leftJoin("programs.submittedBy", "submittedBy")
      .leftJoin("programs.assessedBy", "assessedBy")
      .innerJoin("programs.institution", "institution")
      .innerJoin("institution.institutionType", "institutionType")
      .where("programs.id = :id", { id: programId });
    if (institutionId) {
      query.andWhere("institution.id = :institutionId", { institutionId });
    }
    return query.getOne();
  }

  /**
   * Approve a pending program.
   * this is a db transaction performing
   * 3 functions, creating note, update the
   * program and adding institution notes
   * @param effectiveEndDate effective end date
   * of the approved education program.
   * @param approvalNote approval note.
   * @param institutionId institution id.
   * @param programId program id.
   * @param userId user who is making the changes.
   */
  async approveEducationProgram(
    effectiveEndDate: string,
    approvalNote: string,
    institutionId: number,
    programId: number,
    userId: number,
  ): Promise<void> {
    const auditUser = { id: userId } as User;
    const now = new Date();
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // create Note
      const notes = new Note();
      notes.description = approvalNote;
      notes.noteType = NoteType.Program;
      notes.creator = auditUser;
      notes.createdAt = now;
      const noteObj = await transactionalEntityManager
        .getRepository(Note)
        .save(notes);

      // Update program.
      const program = new EducationProgram();
      program.id = programId;
      program.programStatus = ProgramStatus.Approved;
      program.assessedDate = now;
      program.effectiveEndDate = effectiveEndDate;
      program.assessedBy = auditUser;
      program.modifier = auditUser;
      program.updatedAt = now;
      program.programNote = noteObj;

      await transactionalEntityManager
        .getRepository(EducationProgram)
        .save(program);

      // update institution note
      await transactionalEntityManager
        .getRepository(Institution)
        .createQueryBuilder()
        .relation(Institution, "notes")
        .of({ id: institutionId } as Institution)
        .add(noteObj);
    });
  }

  /**
   * Approve a pending program.
   * this is a db transaction performing
   * 3 functions, creating note, update the
   * program and adding institution notes
   * @param declinedNote decline note.
   * @param institutionId institution id.
   * @param programId program id.
   * @param auditUserId user that should be considered
   * the one that is causing the changes.
   */
  async declineEducationProgram(
    declinedNote: string,
    institutionId: number,
    programId: number,
    auditUserId: number,
  ): Promise<void> {
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // create Note
      const notes = new Note();
      notes.description = declinedNote;
      notes.noteType = NoteType.Program;
      notes.creator = auditUser;
      notes.createdAt = now;
      const noteObj = await transactionalEntityManager
        .getRepository(Note)
        .save(notes);

      // update program
      const program = new EducationProgram();
      program.id = programId;
      program.programStatus = ProgramStatus.Declined;
      program.assessedDate = now;
      program.assessedBy = auditUser;
      program.modifier = auditUser;
      program.updatedAt = now;
      program.programNote = noteObj;
      await transactionalEntityManager
        .getRepository(EducationProgram)
        .save(program);

      // update institution note
      await transactionalEntityManager
        .getRepository(Institution)
        .createQueryBuilder()
        .relation(Institution, "notes")
        .of({ id: institutionId } as Institution)
        .add(noteObj);
    });
  }

  /**
   * Get program irrespective of the status.
   * @param programId Program id.
   * @returns program
   */
  async getProgramById(programId: number): Promise<EducationProgram> {
    return this.repo
      .createQueryBuilder("programs")
      .select([
        "programs.name",
        "programs.programStatus",
        "programs.credentialType",
        "programs.deliveredOnline",
        "programs.deliveredOnSite",
        "programs.description",
        "programs.id",
        "programs.isActive",
        "programs.effectiveEndDate",
      ])
      .where("programs.id = :programId", { programId })
      .getOne();
  }

  /**
   * Get all education programs by the SABC code.
   * @param institutionId institution to have the programs retrieved.
   * @param sabcCodes SABC codes.
   * @returns all education programs by the SABC code for the provided institution.
   */
  async getProgramsBySABCCodes(institutionId: number, sabcCodes: string[]) {
    return this.repo.find({
      select: {
        id: true,
        sabcCode: true,
        name: true,
        programIntensity: true,
        hasWILComponent: true,
        deliveredOnSite: true,
        deliveredOnline: true,
      },
      where: {
        sabcCode: In(sabcCodes),
        institution: {
          id: institutionId,
        },
        isActive: true,
        effectiveEndDate: Or(
          IsNull(),
          MoreThan(getISODateOnlyString(new Date())),
        ),
      },
    });
  }

  /**
   * Check if the given institution has already a program with the given SABC code for an active program.
   * @param institutionId id of the institution to have the programs retrieved.
   * @param sabcCode SABC code.
   * @param programId programId in case it is an update. It will be ignored in case of `undefined`.
   * @returns true in case it has already a SABC code for the institution.
   */
  async hasExistingProgramWithSameSABCCode(
    institutionId: number,
    sabcCode: string,
    programId?: number,
  ): Promise<boolean> {
    return this.repo.exists({
      where: {
        id: programId ? Not(Equal(programId)) : undefined,
        sabcCode: sabcCode,
        institution: {
          id: institutionId,
        },
        isActive: true,
        effectiveEndDate: Or(
          IsNull(),
          MoreThan(getISODateOnlyString(new Date())),
        ),
      },
    });
  }

  /**
   * Update the program active/inactive state.
   * @param programId program to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param isActive value to update the isActive state for the program.
   * @param options method options.
   * - `institutionId` institution used for authorization.
   * - `notes` notes associated with the change.
   * @returns update result.
   */
  async updateEducationProgramIsActive(
    programId: number,
    auditUserId: number,
    isActive: boolean,
    options?: {
      institutionId?: number;
      notes?: string;
    },
  ): Promise<UpdateResult> {
    // Ensures the program exists and the institution has access to it.
    const program = await this.getInstitutionProgram(
      programId,
      options?.institutionId,
    );
    if (!program) {
      throw new CustomNamedError(
        "Not able to find the education program.",
        EDUCATION_PROGRAM_NOT_FOUND,
      );
    }
    // Avoid overriding the record with new auditing values if the isActive is already the expected one.
    if (program.isActive === isActive) {
      throw new CustomNamedError(
        "The education program is already set as requested.",
        EDUCATION_PROGRAM_INVALID_OPERATION,
      );
    }
    return this.dataSource.transaction(async (entityManager) => {
      if (options?.notes) {
        await this.institutionService.createInstitutionNote(
          program.institution.id,
          NoteType.Program,
          options.notes,
          auditUserId,
          entityManager,
        );
      }
      const now = new Date();
      const auditUser = { id: auditUserId } as User;
      return entityManager.getRepository(EducationProgram).update(program.id, {
        isActive,
        isActiveUpdatedBy: auditUser,
        isActiveUpdatedOn: now,
        updatedAt: now,
        modifier: auditUser,
      });
    });
  }

  /**
   * Gets the programs query with the query parameters.
   * @param offeringTypes offering types.
   * @param institutionId institution id.
   * @returns programs query.
   */
  private getProgramsQueryWithQueryParams(
    offeringTypes: OfferingTypes[],
    institutionId: number,
  ): {
    programQuery: SelectQueryBuilder<EducationProgram>;
    queryParams: unknown[];
  } {
    const programQuery = this.repo
      .createQueryBuilder("programs")
      .select("programs.id", "programId")
      .addSelect("programs.name", "programName")
      .addSelect("programs.cipCode", "cipCode")
      .addSelect("programs.credentialType", "credentialType")
      .addSelect("programs.createdAt", "programSubmittedAt")
      .addSelect("location.id", "locationId")
      .addSelect("location.name", "locationName")
      .addSelect("programs.programStatus", "programStatus")
      .addSelect("programs.isActive", "isActive")
      .addSelect("programs.effectiveEndDate", "effectiveEndDate")
      .addSelect(
        (qb) =>
          qb
            .select("COUNT(*)")
            .from(EducationProgramOffering, "offerings")
            .where("offerings.educationProgram.id = programs.id")
            .andWhere("offerings.institutionLocation.id = location.id")
            .andWhere("offerings.offeringType in (:...offeringTypes)", {
              offeringTypes,
            }),
        "totalOfferings",
      )
      .innerJoin("programs.institution", "institution")
      .innerJoin(
        InstitutionLocation,
        "location",
        "institution.id = location.institution.id",
      )
      .where("programs.institution.id = :institutionId", { institutionId });

    // This queryParams is for getRawCount, which is different from the
    // query parameter assigned to paginatedProgramQuery like
    // paginationOptions.searchCriteria or institutionId
    // queryParams should follow the order/index.
    const queryParams: unknown[] = [...offeringTypes, institutionId];

    return { programQuery, queryParams };
  }

  /**
   * Prepares the paginated query and the count.
   * @param paginatedProgramQuery paginated program query.
   * @param paginationOptions pagination options.
   * @param queryParams query parameters.
   * @returns paginated result along with the count.
   */
  private async preparePaginatedProgramQuery(
    paginatedProgramQuery: SelectQueryBuilder<EducationProgram>,
    paginationOptions: PaginationOptions,
    queryParams: unknown[],
  ): Promise<PaginatedResults<EducationProgramsSummary>> {
    // For getting total raw count before pagination.
    const sqlQuery = paginatedProgramQuery.getSql();

    if (paginationOptions.pageLimit) {
      paginatedProgramQuery.limit(paginationOptions.pageLimit);
    }

    paginatedProgramQuery.offset(
      paginationOptions.page * paginationOptions.pageLimit,
    );

    // sort
    if (paginationOptions.sortField === "programStatus") {
      paginatedProgramQuery.orderBy(
        `CASE WHEN programs.isActive = false or (programs.effectiveEndDate is not null and programs.effectiveEndDate <= CURRENT_DATE) THEN '${INACTIVE_PROGRAM}' ELSE programs.programStatus :: text END`,
        paginationOptions.sortOrder,
      );
    } else if (paginationOptions.sortField && paginationOptions.sortOrder) {
      paginatedProgramQuery.orderBy(
        sortProgramsColumnMap(paginationOptions.sortField),
        paginationOptions.sortOrder,
      );
    } else {
      // Default sort and order.
      paginatedProgramQuery.orderBy(
        `CASE           
          WHEN programs.programStatus = '${ProgramStatus.Pending}' and programs.isActive = true and (programs.effectiveEndDate is null OR programs.effectiveEndDate > CURRENT_DATE) THEN ${SortPriority.Priority1}
          WHEN programs.programStatus = '${ProgramStatus.Approved}' and programs.isActive = true and (programs.effectiveEndDate is null OR programs.effectiveEndDate > CURRENT_DATE) THEN ${SortPriority.Priority2}
          WHEN programs.programStatus = '${ProgramStatus.Declined}' and programs.isActive = true and (programs.effectiveEndDate is null OR programs.effectiveEndDate > CURRENT_DATE) THEN ${SortPriority.Priority3}
          WHEN programs.isActive = false or (programs.effectiveEndDate is not null and programs.effectiveEndDate <= CURRENT_DATE) THEN ${SortPriority.Priority4}
          ELSE ${SortPriority.Priority5}
        END`,
      );
    }

    // Total count and summary.
    const [totalCount, programsQuery] = await Promise.all([
      getRawCount(this.repo, sqlQuery, queryParams),
      paginatedProgramQuery.getRawMany(),
    ]);

    const programSummary = programsQuery.map((program) => ({
      programId: program.programId,
      programName: program.programName,
      cipCode: program.cipCode,
      credentialType: program.credentialType,
      submittedDate: program.programSubmittedAt,
      programStatus: program.programStatus,
      isActive: program.isActive,
      isExpired: isSameOrAfterDate(program.effectiveEndDate, new Date()),
      totalOfferings: program.totalOfferings,
      locationId: program.locationId,
      locationName: program.locationName,
    }));

    return {
      results: programSummary,
      count: totalCount,
    };
  }

  /**
   * Saves institution adds pending program notification for the ministry.
   * @param program program
   * @param institutionId related institution id.
   * @param entityManager
   */
  private async saveInstitutionAddsPendingProgramNotification(
    program: Pick<EducationProgram, "name" | "programStatus">,
    institutionId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    if (program.programStatus !== ProgramStatus.Pending) {
      return;
    }
    const institution = await this.institutionService.getInstitutionDetailById(
      institutionId,
      { entityManager },
    );
    const ministryNotification: InstitutionAddsPendingProgramNotification = {
      institutionName: institution.legalOperatingName,
      institutionOperatingName: institution.operatingName,
      programName: program.name,
      institutionPrimaryEmail: institution.primaryEmail,
    };
    await this.notificationActionsService.saveInstitutionAddsPendingProgramNotification(
      ministryNotification,
      entityManager,
    );
  }
}
