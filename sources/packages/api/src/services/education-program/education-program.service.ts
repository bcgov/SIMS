import { Inject, Injectable } from "@nestjs/common";
import {
  EducationProgram,
  EducationProgramOffering,
  Institution,
} from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, Repository } from "typeorm";
import {
  SaveEducationProgram,
  EducationProgramsSummary,
  EducationProgramModel,
} from "./education-program.service.models";
import { ApprovalStatus } from "./constants";
import { ProgramIntensity } from "../../database/entities/program-intensity.type";

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
    program.credentialTypeOther = educationProgram.credentialTypeOther;
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
    program.averageHoursStudy = educationProgram.averageHoursStudy;
    program.completionYears = educationProgram.completionYears;
    program.admissionRequirement = educationProgram.admissionRequirement;
    program.hasMinimunAge = educationProgram.hasMinimunAge;
    program.eslEligibility = educationProgram.eslEligibility;
    program.hasJointInstitution = educationProgram.hasJointInstitution;
    program.hasJointDesignatedInstitution =
      educationProgram.hasJointDesignatedInstitution;
    program.approvalStatus = educationProgram.approvalStatus;
    program.institution = { id: educationProgram.institutionId } as Institution;
    if (educationProgram.programIntensity === "yes")
      program.programIntensity = ProgramIntensity.fullTimePartTime;
    if (educationProgram.programIntensity === "no")
      program.programIntensity = ProgramIntensity.fullTime;
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
        "programs.credentialTypeOther as credentialTypeOther",
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
      summaryItem.credentialTypeOther = summary.credentialtypeother;
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
        "programs.credentialTypeOther",
        "programs.cipCode",
        "programs.nocCode",
        "programs.sabcCode",
        "programs.approvalStatus",
        "programs.programIntensity",
      ])
      .where("programs.id = :id", { id: programId })
      .andWhere("programs.institution.id = :institutionId", { institutionId })
      .getOne();

    const summaryItem = new EducationProgramModel();
    summaryItem.id = educationProgram.id;
    summaryItem.name = educationProgram.name;
    summaryItem.description = educationProgram.description;
    summaryItem.credentialType = educationProgram.credentialType;
    summaryItem.credentialTypeOther = educationProgram.credentialTypeOther;
    summaryItem.cipCode = educationProgram.cipCode;
    summaryItem.nocCode = educationProgram.nocCode;
    summaryItem.sabcCode = educationProgram.sabcCode;
    summaryItem.approvalStatus = educationProgram.approvalStatus;
    summaryItem.programIntensity = educationProgram.programIntensity;
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
  ): Promise<Partial<EducationProgram>[]> {
    const offeringExistsQuery = this.offeringsRepo
      .createQueryBuilder("offerings")
      .where("offerings.educationProgram.id = programs.id")
      .andWhere("offerings.institutionLocation.id = :locationId")
      .select("1");

    return this.repo
      .createQueryBuilder("programs")
      .where("programs.approvalStatus = :approvalStatus", {
        approvalStatus: ApprovalStatus.approved,
      })
      .andWhere(`exists(${offeringExistsQuery.getQuery()})`)
      .select("programs.id")
      .addSelect("programs.name")
      .setParameter("locationId", locationId)
      .orderBy("programs.name")
      .getMany();
  }
}
