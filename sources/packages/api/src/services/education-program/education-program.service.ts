import { Injectable } from "@nestjs/common";
import {
  EducationProgram,
  EducationProgramOffering,
  Institution,
  Note,
  NoteType,
  OfferingTypes,
  User,
  ProgramStatus,
} from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { DataSource, Repository } from "typeorm";
import {
  SaveEducationProgram,
  EducationProgramsSummary,
} from "./education-program.service.models";
import { ProgramYear } from "../../database/entities/program-year.model";
import { InstitutionLocation } from "../../database/entities/institution-location.model";
import {
  ApproveProgram,
  DeclineProgram,
} from "../../route-controllers/education-program/models/save-education-program.dto";
import {
  getRawCount,
  sortProgramsColumnMap,
  PaginationOptions,
  PaginatedResults,
  SortPriority,
} from "../../utilities";
import { EducationProgramOfferingService } from "../education-program-offering/education-program-offering.service";
@Injectable()
export class EducationProgramService extends RecordDataModelService<EducationProgram> {
  private readonly offeringsRepo: Repository<EducationProgramOffering>;
  constructor(
    private readonly dataSource: DataSource,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
  ) {
    super(dataSource.getRepository(EducationProgram));
    this.offeringsRepo = dataSource.getRepository(EducationProgramOffering);
  }

  /**
   * Gets a program and ensure that this program belongs
   * to the expected institution including the institution
   * id in the query.
   * @param programId Program id.
   * @param institutionId Expected institution id.
   * @returns program
   */
  async getInstitutionProgram(
    programId: number,
    institutionId: number,
  ): Promise<EducationProgram> {
    return this.repo
      .createQueryBuilder("programs")
      .where("programs.id = :programId", { programId })
      .andWhere("programs.institution.id = :institutionId", { institutionId })
      .getOne();
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
   * Insert/update an education program at institution level
   * that will be available for all locations.
   * @param educationProgram Information used to save the program.
   * @param createProgram a flag, which create or edit program
   * @returns Education program created/updated.
   */
  async saveEducationProgram(
    educationProgram: SaveEducationProgram,
  ): Promise<EducationProgram> {
    const program = new EducationProgram();

    /** Check if education program has offering(s). This check is required to
     *  prevent a user from updating fields that are not supposed
     *  to be updated if the education program has 1 or more offerings.
     */
    const hasExistingOffering =
      await this.educationProgramOfferingService.hasExistingOffering(
        educationProgram.id,
      );

    // Assign attributes for update from payload only if existing program has no offering(s).
    if (!hasExistingOffering) {
      program.credentialType = educationProgram.credentialType;
      program.cipCode = educationProgram.cipCode;
      program.nocCode = educationProgram.nocCode;
      program.sabcCode = educationProgram.sabcCode;
      program.regulatoryBody = educationProgram.regulatoryBody;
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
      program.institution = {
        id: educationProgram.institutionId,
      } as Institution;
      program.programIntensity = educationProgram.programIntensity;
      program.institutionProgramCode = educationProgram.institutionProgramCode;
      program.minHoursWeek = educationProgram.minHoursWeek;
      program.isAviationProgram = educationProgram.isAviationProgram;
      program.minHoursWeekAvi = educationProgram.minHoursWeekAvi;
      program.minHighSchool =
        educationProgram.entranceRequirements.minHighSchool;
      program.requirementsByInstitution =
        educationProgram.entranceRequirements.requirementsByInstitution;
      program.requirementsByBCITA =
        educationProgram.entranceRequirements.requirementsByBCITA;
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
    program.id = educationProgram.id;
    program.name = educationProgram.name;
    program.description = educationProgram.description;
    if (!educationProgram.id) {
      program.submittedBy = { id: educationProgram.userId } as User;
      program.creator = { id: educationProgram.userId } as User;
    } else {
      program.modifier = { id: educationProgram.userId } as User;
    }
    return this.repo.save(program);
  }

  /**
   * Gets all the programs that are associated with an institution
   * alongside with the total of offerings on a particular location.
   * @param institutionId id of the institution.
   * @param offeringTypes offering types to be considered.
   * @param paginationOptions pagination options
   * @param locationId optional location id to filter while
   * calculating the total of offering.
   * @returns paginated summary for the institution or location.
   */
  async getProgramsSummary(
    institutionId: number,
    offeringTypes: OfferingTypes[],
    paginationOptions: PaginationOptions,
    locationId?: number,
  ): Promise<PaginatedResults<EducationProgramsSummary>> {
    const paginatedProgramQuery = this.repo
      .createQueryBuilder("programs")
      .select("programs.id", "programId")
      .addSelect("programs.name", "programName")
      .addSelect("programs.cipCode", "cipCode")
      .addSelect("programs.credentialType", "credentialType")
      .addSelect("programs.createdAt", "programSubmittedAt")
      .addSelect("location.id", "locationId")
      .addSelect("location.name", "locationName")
      .addSelect("programs.programStatus", "programStatus")
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
    const queryParams: any[] = [...offeringTypes, institutionId];
    if (locationId) {
      queryParams.push(locationId);
      paginatedProgramQuery.andWhere("location.id = :locationId", {
        locationId,
      });
    }

    if (paginationOptions.searchCriteria) {
      paginatedProgramQuery.andWhere("programs.name Ilike :searchCriteria", {
        searchCriteria: `%${paginationOptions.searchCriteria}%`,
      });
      queryParams.push(`%${paginationOptions.searchCriteria}%`);
    }

    // For getting total raw count before pagination.
    const sqlQuery = paginatedProgramQuery.getSql();

    if (paginationOptions.pageLimit) {
      paginatedProgramQuery.limit(paginationOptions.pageLimit);
    }
    if (paginationOptions.page) {
      paginatedProgramQuery.offset(
        paginationOptions.page * paginationOptions.pageLimit,
      );
    } else {
      paginatedProgramQuery.limit(0);
    }
    // sort
    if (paginationOptions.sortField && paginationOptions.sortOrder) {
      paginatedProgramQuery.orderBy(
        sortProgramsColumnMap(paginationOptions.sortField),
        paginationOptions.sortOrder,
      );
    } else {
      // default sort and order
      // TODO:Further investigation needed as the CASE translation does not work in orderby queries.
      paginatedProgramQuery.orderBy(
        `CASE programs.program_status
                WHEN '${ProgramStatus.Pending}' THEN ${SortPriority.Priority1}
                WHEN '${ProgramStatus.Approved}' THEN ${SortPriority.Priority2}
                WHEN '${ProgramStatus.Declined}' THEN ${SortPriority.Priority3}
                ELSE ${SortPriority.Priority4}
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
   * Gets the program with respect to the programId
   * @param programId Id of the Program.
   * @returns summary for location
   */
  async getLocationPrograms(
    programId: number,
    institutionId: number,
  ): Promise<EducationProgram> {
    return this.repo
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
        "programs.institution",
        "institution.id",
        "institution.legalOperatingName",
        "institution.operatingName",
        "programs.submittedDate",
        "submittedBy.firstName",
        "submittedBy.lastName",
        "assessedBy.firstName",
        "assessedBy.lastName",
        "programs.assessedDate",
        "programs.effectiveEndDate",
      ])
      .where("programs.id = :id", { id: programId })
      .andWhere("programs.institution.id = :institutionId", { institutionId })
      .innerJoin("programs.institution", "institution")
      .leftJoin("programs.submittedBy", "submittedBy")
      .leftJoin("programs.assessedBy", "assessedBy")
      .getOne();
  }

  /**
   * Get programs that have at least one offering
   * for a particular location.
   * @param locationId id of the location that should have the
   * offering associated with.
   * @param programYearId program year id
   * @param includeInActivePY includeInActivePY, if includeInActivePY, then both active
   * and not active program year is considered.
   * @returns programs with offerings under the specified location.
   */
  async getProgramsForLocation(
    locationId: number,
    programYearId: number,
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
    return this.repo
      .createQueryBuilder("programs")
      .where("programs.programStatus = :programStatus", {
        programStatus: ProgramStatus.Approved,
      })
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
   * @returns programs under the specified institution.
   */
  async getPrograms(
    institutionId: number,
  ): Promise<Partial<EducationProgram>[]> {
    return this.repo
      .createQueryBuilder("programs")
      .select(["programs.id", "programs.name"])
      .where("programs.programStatus = :programStatus", {
        programStatus: ProgramStatus.Approved,
      })
      .andWhere("programs.institution.id = :institutionId", { institutionId })
      .orderBy("programs.name")
      .getMany();
  }
  /**
   * Gets program details with program id.
   * @param programId Program id.
   * @returns program
   */
  async getEducationProgramDetails(
    programId: number,
  ): Promise<EducationProgram> {
    return this.repo
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
        "programs.minHoursWeekAvi",
        "programs.hasMinimumAge",
        "programs.minHighSchool",
        "programs.requirementsByInstitution",
        "programs.requirementsByBCITA",
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
        "programs.submittedDate",
        "submittedBy.firstName",
        "submittedBy.lastName",
        "assessedBy.firstName",
        "assessedBy.lastName",
        "programs.assessedDate",
        "programs.effectiveEndDate",
      ])
      .leftJoin("programs.submittedBy", "submittedBy")
      .leftJoin("programs.assessedBy", "assessedBy")
      .innerJoin("programs.institution", "institution")
      .where("programs.id = :id", { id: programId })
      .getOne();
  }

  /**
   * Approve a pending program.
   * this is a db transaction performing
   * 3 functions, creating note, update the
   * program and adding institution notes
   * @param institutionId institution id.
   * @param programId program id.
   * @param userId user id.
   * @param payload ApproveProgram
   */
  async approveEducationProgram(
    institutionId: number,
    programId: number,
    userId: number,
    payload: ApproveProgram,
  ): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // create Note
      const notes = new Note();
      notes.description = payload.approvedNote;
      notes.noteType = NoteType.Program;
      notes.creator = {
        id: userId,
      } as User;
      const noteObj = await transactionalEntityManager
        .getRepository(Note)
        .save(notes);

      // update program
      const program = new EducationProgram();
      program.id = programId;
      program.programStatus = ProgramStatus.Approved;
      program.assessedDate = new Date();
      program.effectiveEndDate = new Date(payload.effectiveEndDate);
      program.assessedBy = { id: userId } as User;
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
   * @param institutionId institution id.
   * @param programId program id.
   * @param userId user id.
   * @param payload DeclineProgram
   */
  async declineEducationProgram(
    institutionId: number,
    programId: number,
    userId: number,
    payload: DeclineProgram,
  ): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // create Note
      const notes = new Note();
      notes.description = payload.declinedNote;
      notes.noteType = NoteType.Program;
      notes.creator = {
        id: userId,
      } as User;
      const noteObj = await transactionalEntityManager
        .getRepository(Note)
        .save(notes);

      // update program
      const program = new EducationProgram();
      program.id = programId;
      program.programStatus = ProgramStatus.Declined;
      program.assessedDate = new Date();
      program.assessedBy = { id: userId } as User;
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
      ])
      .where("programs.id = :programId", { programId })
      .getOne();
  }
}
