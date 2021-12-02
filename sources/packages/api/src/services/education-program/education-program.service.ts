import { Inject, Injectable } from "@nestjs/common";
import {
  EducationProgram,
  EducationProgramOffering,
  Institution,
  InstitutionLocation,
} from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, Repository } from "typeorm";
import {
  SaveEducationProgram,
  EducationProgramsSummary,
  EducationProgramModel,
  ProgramsSummary,
} from "./education-program.service.models";
import { ApprovalStatus } from "./constants";
import { ProgramYear } from "../../database/entities/program-year.model";

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
   * @param institutionId Expected intitution id.
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
   * @returns Education program created/updated.
   */
  async saveEducationProgram(
    educationProgram: SaveEducationProgram,
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

    return this.repo.save(program);
  }

  /**
   * Gets all the programs that are associated with an institution
   * alongside with the total of offerings on a particular location.
   * @param institutionId Id of the institution.
   * @param locationId Id of the location.
   * @returns summary for location
   */
  async getSummaryForLocation(
    institutionId: number,
    locationId: number,
  ): Promise<EducationProgramsSummary[]> {
    const summaryResult = await this.repo
      .createQueryBuilder("programs")
      .select([
        "programs.id as id",
        "programs.name as name",
        "programs.cipCode as cipCode",
        "programs.credentialType as credentialType",
        "programs.approvalStatus as approvalStatus",
      ])
      .addSelect(
        (query) =>
          query
            .select("COUNT(*)")
            .from(EducationProgramOffering, "offerings")
            .where("offerings.educationProgram.id = programs.id")
            .andWhere("offerings.institutionLocation.id = :locationId", {
              locationId,
            }),
        "totalofferings",
      )
      .where("programs.institution.id = :institutionId", { institutionId })
      .getRawMany();

    return summaryResult.map((summary) => {
      const summaryItem = new EducationProgramsSummary();
      summaryItem.id = summary.id;
      summaryItem.name = summary.name;
      summaryItem.cipCode = summary.cipcode;
      summaryItem.credentialType = summary.credentialtype;
      summaryItem.approvalStatus = summary.approvalstatus;
      summaryItem.totalOfferings = summary.totalofferings;
      return summaryItem;
    });
  }

  /**
   * Gets the program with respect to the programId
   * @param programId Id of the Program.
   * @returns summary for location
   */
  async getLocationPrograms(
    programId: number,
    institutionId: number,
  ): Promise<EducationProgramModel> {
    const educationProgram = await this.repo
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
      ])
      .where("programs.id = :id", { id: programId })
      .andWhere("programs.institution.id = :institutionId", { institutionId })
      .getOne();

    const summaryItem = new EducationProgramModel();
    summaryItem.id = educationProgram.id;
    summaryItem.name = educationProgram.name;
    summaryItem.description = educationProgram.description;
    summaryItem.credentialType = educationProgram.credentialType;
    summaryItem.cipCode = educationProgram.cipCode;
    summaryItem.nocCode = educationProgram.nocCode;
    summaryItem.sabcCode = educationProgram.sabcCode;
    summaryItem.approvalStatus = educationProgram.approvalStatus;
    summaryItem.programIntensity = educationProgram.programIntensity;
    summaryItem.institutionProgramCode =
      educationProgram.institutionProgramCode;
    return summaryItem;
  }

  /**
   * Get programs that have at least one offering
   * for a particular location.
   * @param locationId id of the location that should have the
   * offering associated with.
   * @returns programs with offerings under the specified location.
   */
  async getProgramsForLocation(
    locationId: number,
    programYearId: number,
  ): Promise<Partial<EducationProgram>[]> {
    const offeringExistsQuery = this.offeringsRepo
      .createQueryBuilder("offerings")
      .innerJoin(ProgramYear, "programYear", "programYear.id = :programYearId")
      .where("offerings.educationProgram.id = programs.id")
      .andWhere("offerings.institutionLocation.id = :locationId")
      .andWhere(
        "offerings.studyStartDate BETWEEN programYear.startDate AND programYear.endDate",
      )
      .andWhere("programYear.active = true")
      .select("1");
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
      .select("programs.id")
      .addSelect("programs.name")
      .where("programs.approvalStatus = :approvalStatus", {
        approvalStatus: ApprovalStatus.approved,
      })
      .andWhere("programs.institution.id = :institutionId", { institutionId })
      .orderBy("programs.name")
      .getMany();
  }

  /**
   * Get programs for a particular institution in paginated.
   * @param institutionId id of the institution.
   * @returns programs under the specified institution.
   */
  async getPaginatedProgramsForInstitution(
    institutionId: number,
  ): Promise<ProgramsSummary[]> {
    const paginatedProgramSummaryResult = await this.repo
      .createQueryBuilder("programs")
      .select([
        "programs.id as programid",
        "programs.name as programname",
        "programs.createdAt as submitteddate",
        "locations.name as locationname",
        "programs.approvalStatus as programstatus",
      ])
      .addSelect("COUNT(offerings.id)", "offeringscount")
      .innerJoin(
        InstitutionLocation,
        "locations",
        "locations.institution = programs.institution",
      )
      .innerJoin(
        EducationProgramOffering,
        "offerings",
        "offerings.educationProgram = programs.id AND offerings.institutionLocation = locations.id",
      )
      .andWhere("programs.institution.id = :institutionId", { institutionId })
      .orderBy("programs.createdAt")
      .groupBy("programs.id")
      .addGroupBy("programs.name")
      .addGroupBy("programs.createdAt")
      .addGroupBy("locations.id")
      .addGroupBy("locations.name")
      .addGroupBy("programs.approvalStatus")
      .getRawMany();
    return paginatedProgramSummaryResult.map((programSummary) => {
      const paginatedProgramSummaryItem = new ProgramsSummary();
      paginatedProgramSummaryItem.programId = programSummary.programid;
      paginatedProgramSummaryItem.programName = programSummary.programname;
      paginatedProgramSummaryItem.submittedDate = programSummary.submitteddate;
      paginatedProgramSummaryItem.locationName = programSummary.locationname;
      paginatedProgramSummaryItem.programStatus = programSummary.programstatus;
      paginatedProgramSummaryItem.offeringsCount =
        programSummary.offeringscount;
      return paginatedProgramSummaryItem;
    }) as ProgramsSummary[];
  }
}
