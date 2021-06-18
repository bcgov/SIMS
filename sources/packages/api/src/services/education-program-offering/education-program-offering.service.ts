import { Inject, Injectable } from "@nestjs/common";
import {
  EducationProgramOffering,
  EducationProgram,
  InstitutionLocation,
} from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { CreateEducationProgramOfferingDto } from "../../route-controllers/education-program-offering/models/education-program-offering.dto";
import {
  EducationProgramOfferingModel,
  ProgramOfferingModel,
} from "./education-program-offering.service.models";

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
    programOffering.actualTuitionCosts =
      educationProgramOffering.actualTuitionCosts;
    programOffering.programRelatedCosts =
      educationProgramOffering.programRelatedCosts;
    programOffering.mandatoryFees = educationProgramOffering.mandatoryFees;
    programOffering.exceptionalExpenses =
      educationProgramOffering.exceptionalExpenses;
    programOffering.tuitionRemittanceRequestedAmount =
      educationProgramOffering.tuitionRemittanceRequestedAmount;
    programOffering.offeringDelivered =
      educationProgramOffering.offeringDelivered;
    programOffering.lacksStudyDates = educationProgramOffering.lacksStudyDates;
    programOffering.lacksStudyBreaks =
      educationProgramOffering.lacksStudyBreaks;
    programOffering.lacksFixedCosts = educationProgramOffering.lacksFixedCosts;
    programOffering.tuitionRemittanceRequested =
      educationProgramOffering.tuitionRemittanceRequested;
    programOffering.educationProgram = { id: programId } as EducationProgram;
    programOffering.institutionLocation = {
      id: locationId,
    } as InstitutionLocation;
    return this.repo.save(programOffering);
  }

  /**
   * This is to fetch all the Education Offering
   * that are associated with the Location and Program
   * @param locationId
   * @param programId
   * @returns
   */
  async getAllEducationProgramOffering(
    locationId: number,
    programId: number,
  ): Promise<EducationProgramOfferingModel[]> {
    const educationProgramOfferingResult = await this.repo
      .createQueryBuilder("offerings")
      .select([
        "offerings.id",
        "offerings.name",
        "offerings.studyStartDate",
        "offerings.studyEndDate",
        "offerings.offeringDelivered",
      ])
      .innerJoin("offerings.educationProgram", "educationProgram")
      .innerJoin("offerings.institutionLocation", "institutionLocation")
      .where(
        "educationProgram.id = :programId and institutionLocation.id = :locationId",
        { programId: programId, locationId: locationId },
      )
      .getMany();

    return educationProgramOfferingResult.map((educationProgramOffering) => {
      const item = new EducationProgramOfferingModel();
      item.id = educationProgramOffering.id;
      item.name = educationProgramOffering.name;
      item.studyStartDate = educationProgramOffering.studyStartDate;
      item.studyEndDate = educationProgramOffering.studyEndDate;
      item.offeringDelivered = educationProgramOffering.offeringDelivered;
      return item;
    });
  }

  /**
   * This is to fetch the Education Offering
   * that are associated with the Location, Program
   * and offering
   * @param locationId
   * @param programId
   * @param offeringId
   * @returns
   */
  async getProgramOffering(
    locationId: number,
    programId: number,
    offeringId: number,
  ): Promise<ProgramOfferingModel> {
    const educationProgramOffering = await this.repo
      .createQueryBuilder("offerings")
      .select([
        "offerings.id",
        "offerings.name",
        "offerings.studyStartDate",
        "offerings.studyEndDate",
        "offerings.breakStartDate",
        "offerings.breakEndDate",
        "offerings.actualTuitionCosts",
        "offerings.programRelatedCosts",
        "offerings.mandatoryFees",
        "offerings.exceptionalExpenses",
        "offerings.tuitionRemittanceRequestedAmount",
        "offerings.offeringDelivered",
        "offerings.lacksStudyDates",
        "offerings.lacksStudyBreaks",
        "offerings.lacksFixedCosts",
        "offerings.tuitionRemittanceRequested",
      ])
      .innerJoin("offerings.educationProgram", "educationProgram")
      .innerJoin("offerings.institutionLocation", "institutionLocation")
      .where(
        "offerings.id= :offeringId and educationProgram.id = :programId and institutionLocation.id = :locationId",
        {
          offeringId: offeringId,
          programId: programId,
          locationId: locationId,
        },
      )
      .getOne();

    return educationProgramOffering;
  }
}
