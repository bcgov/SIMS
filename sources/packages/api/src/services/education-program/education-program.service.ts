import { Inject, Injectable } from "@nestjs/common";
import {
  EducationProgram,
  EducationProgramOffering,
  Institution,
  Note,
  NoteType,
  OfferingTypes,
  User,
} from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, Repository } from "typeorm";
import {
  SaveEducationProgram,
  EducationProgramsSummary,
} from "./education-program.service.models";
import { ApprovalStatus } from "./constants";
import { ProgramYear } from "../../database/entities/program-year.model";
import { InstitutionLocation } from "../../database/entities/institution-location.model";
import {
  ApproveProgram,
  DeclineProgram,
  ProgramsSummary,
} from "../../route-controllers/education-program/models/save-education-program.dto";
import {
  credentialTypeToDisplay,
  FieldSortOrder,
  getRawCount,
  getDateOnlyFormat,
  sortProgramsColumnMap,
  PaginationOptions,
  PaginatedResults,
  CustomNamedError,
} from "../../utilities";
const PROGRAM_NOT_FOUND = "PROGRAM_NOT_FOUND";
@Injectable()
export class EducationProgramService extends RecordDataModelService<EducationProgram> {
  private readonly offeringsRepo: Repository<EducationProgramOffering>;
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(EducationProgram));
    this.offeringsRepo = connection.getRepository(EducationProgramOffering);
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
      .andWhere("programs.approvalStatus = :approvalStatus", {
        approvalStatus: ApprovalStatus.approved,
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
    createProgram?: boolean,
  ): Promise<EducationProgram> {
    const program = new EducationProgram();
    program.id = educationProgram.id;
    program.name = educationProgram.name;
    program.description = educationProgram.description;
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
    program.sameOnlineCreditsEarned = educationProgram.sameOnlineCreditsEarned;
    program.earnAcademicCreditsOtherInstitution =
      educationProgram.earnAcademicCreditsOtherInstitution;
    program.courseLoadCalculation = educationProgram.courseLoadCalculation;
    program.completionYears = educationProgram.completionYears;
    program.hasMinimumAge = educationProgram.entranceRequirements.hasMinimumAge;
    program.eslEligibility = educationProgram.eslEligibility;
    program.hasJointInstitution = educationProgram.hasJointInstitution;
    program.hasJointDesignatedInstitution =
      educationProgram.hasJointDesignatedInstitution;
    program.approvalStatus = educationProgram.approvalStatus;
    program.institution = { id: educationProgram.institutionId } as Institution;
    program.programIntensity = educationProgram.programIntensity;
    program.institutionProgramCode = educationProgram.institutionProgramCode;
    program.minHoursWeek = educationProgram.minHoursWeek;
    program.isAviationProgram = educationProgram.isAviationProgram;
    program.minHoursWeekAvi = educationProgram.minHoursWeekAvi;
    program.minHighSchool = educationProgram.entranceRequirements.minHighSchool;
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
    program.statusUpdatedBy = { id: educationProgram.userId } as User;
    if (createProgram) {
      program.submittedBy = { id: educationProgram.userId } as User;
    }
    return this.repo.save(program);
  }

  /**
   * Gets all the programs that are associated with an institution
   * alongside with the total of offerings on a particular location.
   * @param institutionId Id of the institution.
   * @param locationId Id of the location.
   * @param offeringTypes OfferingTypes array.
   * @param paginationOptions pagination options
   * @returns summary for location
   */
  async getSummaryForLocation(
    institutionId: number,
    locationId: number,
    offeringTypes: OfferingTypes[],
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<EducationProgramsSummary>> {
    const summaryResult = this.repo
      .createQueryBuilder("programs")
      .select("programs.id", "id")
      .addSelect("programs.name", "programName")
      .addSelect("programs.cipCode", "cipCode")
      .addSelect("programs.credentialType", "credentialType")
      .addSelect("programs.approvalStatus", "approvalStatus")
      .addSelect(
        (query) =>
          query
            .select("COUNT(*)")
            .from(EducationProgramOffering, "offerings")
            .where("offerings.educationProgram.id = programs.id")
            .andWhere("offerings.offeringType in (:...offeringTypes)", {
              offeringTypes,
            })
            .andWhere("offerings.institutionLocation.id = :locationId", {
              locationId,
            }),
        "totalOfferings",
      )
      .where("programs.institution.id = :institutionId", { institutionId })
      .orderBy("programs.id");

    // this queryParams is for getRawCount, which is different from the
    // query parameter assigned to paginatedProgramQuery like
    // paginationOptions.searchCriteria or institutionId.
    // queryParams should follow the order/index
    const queryParams: any[] = [...offeringTypes, locationId, institutionId];
    // program name search
    if (paginationOptions.searchCriteria) {
      summaryResult.andWhere("programs.name Ilike :searchCriteria", {
        searchCriteria: `%${paginationOptions.searchCriteria}%`,
      });
      queryParams.push(`%${paginationOptions.searchCriteria}%`);
    }

    // for getting total raw count before pagination
    const sqlQuery = summaryResult.getSql();

    // pagination
    summaryResult
      .skip(paginationOptions.page * paginationOptions.pageLimit)
      .take(paginationOptions.pageLimit);

    // sort
    if (paginationOptions.sortField && paginationOptions.sortOrder) {
      summaryResult.orderBy(
        sortProgramsColumnMap(paginationOptions.sortField),
        paginationOptions.sortOrder,
      );
    } else {
      // default sort and order
      summaryResult.orderBy(
        `CASE programs.approvalStatus
                WHEN '${ApprovalStatus.pending}' THEN 1
                WHEN '${ApprovalStatus.approved}' THEN 2
                WHEN '${ApprovalStatus.denied}' THEN 3
                ELSE 4
              END`,
      );
    }

    // total count and summary
    const [totalCount, programs] = await Promise.all([
      getRawCount(this.repo, sqlQuery, queryParams),
      summaryResult.getRawMany(),
    ]);

    const programSummary = programs.map((summary) => {
      const summaryItem = new EducationProgramsSummary();
      summaryItem.id = summary.id;
      summaryItem.programName = summary.programName;
      summaryItem.cipCode = summary.cipCode;
      summaryItem.credentialType = summary.credentialType;
      summaryItem.credentialTypeToDisplay = credentialTypeToDisplay(
        summary.credentialType,
      );
      summaryItem.approvalStatus = summary.approvalStatus;
      summaryItem.totalOfferings = summary.totalOfferings;
      return summaryItem;
    });
    return {
      results: programSummary,
      count: totalCount,
    };
  }
  /**
   * Gets all the programs that are associated with an institution
   * alongside with the total of offerings on a particular location.
   * @param institutionId Id of the institution.
   * @param offeringTypes OfferingTypes array.
   * @param paginationOptions pagination options
   * @returns summary for location
   */
  async getPaginatedProgramsForAEST(
    institutionId: number,
    offeringTypes: OfferingTypes[],
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<ProgramsSummary>> {
    // default data table sort field
    const paginatedProgramQuery = this.repo
      .createQueryBuilder("programs")
      .select("programs.id", "programId")
      .addSelect("programs.name", "programName")
      .addSelect("programs.createdAt", "programSubmittedAt")
      .addSelect("location.id", "locationId")
      .addSelect("location.name", "locationName")
      .addSelect("programs.approvalStatus", "approvalStatus")
      .addSelect(
        (query) =>
          query
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
      .where("programs.institution.id = :institutionId", { institutionId })
      .orderBy("programs.id");

    // this queryParams is for getRawCount, which is different from the
    // query parameter assigned to paginatedProgramQuery like
    // paginationOptions.searchCriteria or institutionId
    // queryParams should follow the order/index
    const queryParams: any[] = [...offeringTypes, institutionId];

    if (paginationOptions.searchCriteria) {
      paginatedProgramQuery.andWhere("programs.name Ilike :searchCriteria", {
        searchCriteria: `%${paginationOptions.searchCriteria}%`,
      });
      queryParams.push(`%${paginationOptions.searchCriteria}%`);
    }

    // for getting total raw count before pagination
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
      paginatedProgramQuery.orderBy(
        `CASE programs.approvalStatus
                WHEN '${ApprovalStatus.pending}' THEN 1
                WHEN '${ApprovalStatus.approved}' THEN 2
                WHEN '${ApprovalStatus.denied}' THEN 3
                ELSE 4
              END`,
      );
    }

    // total count and summary
    const [totalCount, programsQuery] = await Promise.all([
      getRawCount(this.repo, sqlQuery, queryParams),
      paginatedProgramQuery.getRawMany(),
    ]);

    const programSummary = programsQuery.map((summary) => {
      const summaryItem = new ProgramsSummary();
      summaryItem.programId = summary.programId;
      summaryItem.programName = summary.programName;
      summaryItem.submittedDate = summary.programSubmittedAt;
      summaryItem.locationName = summary.locationName;
      summaryItem.locationId = summary.locationId;
      summaryItem.programStatus = summary.approvalStatus;
      summaryItem.totalOfferings = summary.totalOfferings;
      summaryItem.formattedSubmittedDate = getDateOnlyFormat(
        summary.programSubmittedAt,
      );
      return summaryItem;
    });

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
        "programs.approvalStatus",
        "programs.programIntensity",
        "programs.institutionProgramCode",
        "programs.institution",
        "institution.id",
        "institution.legalOperatingName",
        "programs.submittedOn",
        "submittedBy.firstName",
        "submittedBy.lastName",
        "statusUpdatedBy.firstName",
        "statusUpdatedBy.lastName",
        "programs.statusUpdatedOn",
        "programs.effectiveEndDate",
      ])
      .where("programs.id = :id", { id: programId })
      .andWhere("programs.institution.id = :institutionId", { institutionId })
      .innerJoin("programs.institution", "institution")
      .leftJoin("programs.submittedBy", "submittedBy")
      .leftJoin("programs.statusUpdatedBy", "statusUpdatedBy")
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
      .where("programs.approvalStatus = :approvalStatus", {
        approvalStatus: ApprovalStatus.approved,
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
      .where("programs.approvalStatus = :approvalStatus", {
        approvalStatus: ApprovalStatus.approved,
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
        "programs.approvalStatus",
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
        "programs.submittedOn",
        "submittedBy.firstName",
        "submittedBy.lastName",
        "statusUpdatedBy.firstName",
        "statusUpdatedBy.lastName",
        "programs.statusUpdatedOn",
        "programs.effectiveEndDate",
      ])
      .leftJoin("programs.submittedBy", "submittedBy")
      .leftJoin("programs.statusUpdatedBy", "statusUpdatedBy")
      .innerJoin("programs.institution", "institution")
      .where("programs.id = :id", { id: programId })
      .getOne();
  }

  /**
   * Approve a pending program.
   * @param programId program id.
   * @param userId user id.
   * @param payload ApproveProgram
   * @param returns EducationProgram
   */
  async approveEducationProgram(
    programId: number,
    userId: number,
    payload: ApproveProgram,
  ): Promise<EducationProgram> {
    const program = await this.repo.findOne(
      {
        id: programId,
        approvalStatus: ApprovalStatus.pending,
      },
      {
        relations: ["programNote", "statusUpdatedBy"],
      },
    );

    if (!program) {
      throw new CustomNamedError(
        "Program with pending status not found.",
        PROGRAM_NOT_FOUND,
      );
    }

    program.approvalStatus = ApprovalStatus.approved;
    program.statusUpdatedOn = new Date();
    program.effectiveEndDate = new Date(payload.effectiveEndDate);
    program.statusUpdatedBy = { id: userId } as User;
    program.programNote = {
      description: payload.approvedNote,
      noteType: NoteType.Program,
      creator: {
        id: userId,
      } as User,
    } as Note;

    return this.repo.save(program);
  }

  /**
   * Approve a pending program.
   * @param programId program id.
   * @param userId user id.
   * @param payload DeclineProgram
   * @param returns EducationProgram
   */
  async declineEducationProgram(
    programId: number,
    userId: number,
    payload: DeclineProgram,
  ): Promise<EducationProgram> {
    const program = await this.repo.findOne(
      {
        id: programId,
        approvalStatus: ApprovalStatus.pending,
      },
      {
        relations: ["programNote", "statusUpdatedBy"],
      },
    );

    if (!program) {
      throw new CustomNamedError(
        "Program with pending status not found.",
        PROGRAM_NOT_FOUND,
      );
    }

    program.approvalStatus = ApprovalStatus.denied;
    program.statusUpdatedOn = new Date();
    program.statusUpdatedBy = { id: userId } as User;
    program.programNote = {
      description: payload.declinedNote,
      noteType: NoteType.Program,
      creator: {
        id: userId,
      } as User,
    } as Note;
    return this.repo.save(program);
  }
}
