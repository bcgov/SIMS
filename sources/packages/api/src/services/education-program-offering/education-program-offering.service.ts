import { Inject, Injectable } from "@nestjs/common";
import {
  EducationProgramOffering,
  EducationProgram,
  InstitutionLocation,
} from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { CreateEducationProgramOfferingDto } from "src/route-controllers/education-program-offering/models/create-education-program-offering.dto";

@Injectable()
export class EducationProgramOfferingService extends RecordDataModelService<EducationProgramOffering> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(EducationProgramOffering));
  }

  /**
   * Creates a new education program offering at program level
   * @param locationId location id to associate the new program offering.
   * @param programId program id to associate the new program offering.
   * @param educationProgramOffering Information used to create the program offering.
   * @returns Education program offering created.
   */
  async createEducationProgramOffering(
    locationId: number,
    programId: number,
    educationProgramOffering: CreateEducationProgramOfferingDto,
  ): Promise<EducationProgramOffering> {
    const programOffering = new EducationProgramOffering();
    programOffering.name = educationProgramOffering.name;
    programOffering.studyStartDate = educationProgramOffering.studyStartDate;
    programOffering.studyEndDate = educationProgramOffering.studyEndDate;
    programOffering.breakStartDate = educationProgramOffering.breakStartDate;
    programOffering.breakEndDate = educationProgramOffering.breakEndDate;
    programOffering.actualTutionCosts =
      educationProgramOffering.actualTutionCosts;
    programOffering.programRelatedCosts =
      educationProgramOffering.programRelatedCosts;
    programOffering.mandatoryFees = educationProgramOffering.mandatoryFees;
    programOffering.exceptionalExpenses =
      educationProgramOffering.exceptionalExpenses;
    programOffering.amountRequested = educationProgramOffering.amountRequested;
    programOffering.offeringDelivered =
      educationProgramOffering.offeringDelivered;
    programOffering.lacksProgramDates =
      educationProgramOffering.lacksProgramDates;
    programOffering.lacksStudyBreaks =
      educationProgramOffering.lacksStudyBreaks;
    programOffering.lacksFixedCosts = educationProgramOffering.lacksFixedCosts;
    programOffering.tutionRemittanceRequested =
      educationProgramOffering.tutionRemittanceRequested;
    programOffering.educationProgram = { id: programId } as EducationProgram;
    programOffering.institutionLocation = {
      id: locationId,
    } as InstitutionLocation;
    return this.repo.save(programOffering);
  }
}
