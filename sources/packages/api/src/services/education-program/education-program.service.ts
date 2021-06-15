import { Inject, Injectable } from "@nestjs/common";
import {
  EducationProgram,
  EducationProgramOffering,
  Institution,
} from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import {
  CreateEducationProgram,
  EducationProgramsSummary,
} from "./education-program.service.models";

@Injectable()
export class EducationProgramService extends RecordDataModelService<EducationProgram> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(EducationProgram));
  }

  /**
   * Creates a new education program at institution level
   * that will be available for all locations.
   * @param educationProgram Information used to create the program.
   * @returns Education program created.
   */
  async createEducationProgram(
    educationProgram: CreateEducationProgram,
  ): Promise<EducationProgram> {
    const program = new EducationProgram();
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
}
