import { Inject, Injectable } from "@nestjs/common";
import {
  EducationProgramOffering,
  EducationProgram,
  InstitutionLocation,
  OfferingTypes,
  OfferingIntensity,
} from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, UpdateResult } from "typeorm";
import { SaveEducationProgramOfferingDto } from "../../route-controllers/education-program-offering/models/education-program-offering.dto";
import {
  EducationProgramOfferingModel,
  ProgramOfferingModel,
} from "./education-program-offering.service.models";
import { ApprovalStatus } from "../education-program/constants";
import { ProgramYear } from "../../database/entities/program-year.model";
import { SortDBOrder } from "src/types/sortDBOrder";

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
    educationProgramOffering: SaveEducationProgramOfferingDto,
  ): Promise<EducationProgramOffering> {
    const programOffering = this.populateProgramOffering(
      locationId,
      programId,
      educationProgramOffering,
    );
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
    offeringTypes?: OfferingTypes[],
  ): Promise<EducationProgramOfferingModel[]> {
    let offeringsQuery = this.repo
      .createQueryBuilder("offerings")
      .select([
        "offerings.id",
        "offerings.name",
        "offerings.studyStartDate",
        "offerings.studyEndDate",
        "offerings.offeringDelivered",
        "offerings.offeringIntensity",
      ])
      .innerJoin("offerings.educationProgram", "educationProgram")
      .innerJoin("offerings.institutionLocation", "institutionLocation")
      .where("educationProgram.id = :programId", { programId })
      .andWhere("institutionLocation.id = :locationId", { locationId });
    if (offeringTypes) {
      offeringsQuery = offeringsQuery.andWhere(
        "offerings.offeringType in (:...offeringTypes)",
        {
          offeringTypes,
        },
      );
    }

    const queryResult = await offeringsQuery.getMany();

    return queryResult.map((educationProgramOffering) => {
      const item = new EducationProgramOfferingModel();
      item.id = educationProgramOffering.id;
      item.name = educationProgramOffering.name;
      item.studyStartDate = educationProgramOffering.studyStartDate;
      item.studyEndDate = educationProgramOffering.studyEndDate;
      item.offeringDelivered = educationProgramOffering.offeringDelivered;
      item.offeringIntensity = educationProgramOffering.offeringIntensity;
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
    return this.repo
      .createQueryBuilder("offerings")
      .select([
        "offerings.id",
        "offerings.name",
        "offerings.studyStartDate",
        "offerings.studyEndDate",
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
        "offerings.offeringIntensity",
        "offerings.yearOfStudy",
        "offerings.showYearOfStudy",
        "offerings.hasOfferingWILComponent",
        "offerings.offeringWILType",
        "offerings.studyBreaks",
        "offerings.offeringDeclaration",
      ])
      .innerJoin("offerings.educationProgram", "educationProgram")
      .innerJoin("offerings.institutionLocation", "institutionLocation")
      .andWhere("offerings.id= :offeringId", {
        offeringId: offeringId,
      })
      .andWhere("educationProgram.id = :programId", {
        programId: programId,
      })
      .andWhere("institutionLocation.id = :locationId", {
        locationId: locationId,
      })
      .getOne();
  }

  /**
   * Creates a new education program offering at program level
   * @param locationId location id to associate the new program offering.
   * @param programId program id to associate the new program offering.
   * @param educationProgramOffering Information used to create the program offering.
   * @returns Education program offering created.
   */
  async updateEducationProgramOffering(
    locationId: number,
    programId: number,
    offeringId: number,
    educationProgramOffering: SaveEducationProgramOfferingDto,
  ): Promise<UpdateResult> {
    const programOffering = this.populateProgramOffering(
      locationId,
      programId,
      educationProgramOffering,
    );
    return this.repo.update(offeringId, programOffering);
  }

  populateProgramOffering(
    locationId: number,
    programId: number,
    educationProgramOffering: SaveEducationProgramOfferingDto,
  ): EducationProgramOffering {
    const programOffering = new EducationProgramOffering();
    programOffering.name = educationProgramOffering.offeringName;
    programOffering.studyStartDate = educationProgramOffering.studyStartDate;
    programOffering.studyEndDate = educationProgramOffering.studyEndDate;
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
    programOffering.offeringType =
      educationProgramOffering.offeringType ?? OfferingTypes.public;
    programOffering.educationProgram = { id: programId } as EducationProgram;
    programOffering.institutionLocation = {
      id: locationId,
    } as InstitutionLocation;
    programOffering.offeringIntensity =
      educationProgramOffering.offeringIntensity;
    programOffering.yearOfStudy = educationProgramOffering.yearOfStudy;
    programOffering.showYearOfStudy = educationProgramOffering.showYearOfStudy;
    programOffering.hasOfferingWILComponent =
      educationProgramOffering.hasOfferingWILComponent;
    programOffering.offeringWILType = educationProgramOffering.offeringWILType;
    programOffering.studyBreaks = educationProgramOffering.studyBreaks;
    programOffering.offeringDeclaration =
      educationProgramOffering.offeringDeclaration;
    return programOffering;
  }

  /**
   * Gets program offerings for location.
   * @param programId program id to be filter.
   * @param locationId location id to filter.
   * @returns program offerings for location.
   */
  async getProgramOfferingsForLocation(
    locationId: number,
    programId: number,
    programYearId: number,
    selectedIntensity?: OfferingIntensity,
  ): Promise<Partial<EducationProgramOffering>[]> {
    const query = this.repo
      .createQueryBuilder("offerings")
      .innerJoin("offerings.educationProgram", "programs")
      .innerJoin(
        ProgramYear,
        "programYear",
        "programYear.id = :programYearId",
        { programYearId },
      )
      .select("offerings.id")
      .addSelect("offerings.name")
      .addSelect("offerings.studyStartDate")
      .addSelect("offerings.studyEndDate")
      .addSelect("offerings.yearOfStudy")
      .addSelect("offerings.showYearOfStudy")
      .where("offerings.educationProgram.id = :programId", { programId })
      .andWhere("programs.approvalStatus = :approvalStatus", {
        approvalStatus: ApprovalStatus.approved,
      })
      .andWhere("offerings.institutionLocation.id = :locationId", {
        locationId,
      })
      .andWhere("offerings.offeringType = :offeringType", {
        offeringType: OfferingTypes.public,
      })
      .andWhere(
        "offerings.studyStartDate BETWEEN programYear.startDate AND programYear.endDate",
      )
      .andWhere("programYear.active = true");
    if (selectedIntensity) {
      query.andWhere("offerings.offeringIntensity = :selectedIntensity", {
        selectedIntensity,
      });
    }
    return query.orderBy("offerings.name").getMany();
  }

  /**
   * Gets location id from an offering.
   * @param offeringId offering id.
   * @returns offering location id.
   */
  async getOfferingLocationId(offeringId: number): Promise<number> {
    const locationIdQuery = await this.repo
      .createQueryBuilder("offerings")
      .innerJoin("offerings.institutionLocation", "location")
      .select("location.id", "locationId")
      .where("offerings.id = :offeringId", { offeringId })
      .getRawOne();

    return locationIdQuery.locationId;
  }

  /**
   * Gets location id from an offering.
   * @param offeringId offering id.
   * @returns offering object.
   */
  async getOfferingById(offeringId: number): Promise<EducationProgramOffering> {
    return this.repo.findOne(offeringId);
  }

  /**
   * Get programs for a particular institution in paginated.
   * @param institutionId id of the institution.
   * @returns programs under the specified institution.
   */
  async getPaginatedProgramsForInstitution(
    institutionId: number,
    take: number,
    skip: number,
    dateSubmittedOrder: SortDBOrder,
    searchName: string,
  ): Promise<[EducationProgramOffering[], number]> {
    const paginatedProgramQuery = await this.repo
      .createQueryBuilder("offerings")
      .select([
        "offerings.id",
        "programs.id",
        "programs.name",
        "programs.createdAt",
        "locations.name",
        "programs.approvalStatus",
      ])
      .innerJoin("offerings.educationProgram", "programs")
      .innerJoin("offerings.institutionLocation", "locations")
      .where("programs.institution.id = :institutionId", { institutionId });
    if (searchName) {
      paginatedProgramQuery.andWhere("programs.name = :searchName", {
        searchName,
      });
    }
    paginatedProgramQuery
      .take(take)
      .skip(skip)
      .groupBy("offerings.id")
      .addGroupBy("locations.id")
      .addGroupBy("locations.name")
      .addGroupBy("programs.id")
      .addGroupBy("programs.name")
      .addGroupBy("programs.createdAt")
      .addGroupBy("programs.approvalStatus")
      .orderBy("programs.createdAt", dateSubmittedOrder);
    return paginatedProgramQuery.getManyAndCount();
  }
}
