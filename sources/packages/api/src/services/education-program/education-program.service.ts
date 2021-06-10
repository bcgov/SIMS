import { Inject, Injectable } from "@nestjs/common";
import { EducationProgram, Institution } from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { CreateEducationProgramDto } from "src/route-controllers/education-program/models/create-education-program.dto";

@Injectable()
export class EducationProgramService extends RecordDataModelService<EducationProgram> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(EducationProgram));
  }

  /**
   * Creates a new education program at institution level
   * that will be available for all locations.
   * @param institutionId Institution id to associate the new program.
   * @param educationProgram Information used to create the program.
   * @returns Education program created.
   */
  async createEducationProgram(
    institutionId: number,
    educationProgram: CreateEducationProgramDto,
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
    program.institution = { id: institutionId } as Institution;
    return this.repo.save(program);
  }
}
