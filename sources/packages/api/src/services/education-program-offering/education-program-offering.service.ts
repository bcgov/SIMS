import { Injectable } from "@nestjs/common";
import {
  EducationProgramOffering,
  EducationProgram,
  InstitutionLocation,
  OfferingTypes,
  ProgramStatus,
  OfferingStatus,
  Note,
  NoteType,
  User,
  Institution,
  StudentAssessment,
} from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { DataSource, UpdateResult } from "typeorm";
import {
  EducationProgramOfferingModel,
  SaveOfferingModel,
  OfferingsFilter,
} from "./education-program-offering.service.models";
import { ProgramYear } from "../../database/entities/program-year.model";
import {
  FieldSortOrder,
  sortOfferingsColumnMap,
  PaginationOptions,
  PaginatedResults,
  getISODateOnlyString,
  CustomNamedError,
} from "../../utilities";
import { OFFERING_NOT_VALID } from "../../constants";

@Injectable()
export class EducationProgramOfferingService extends RecordDataModelService<EducationProgramOffering> {
  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(EducationProgramOffering));
  }

  /**
   * Creates a new education program offering at program level
   * @param locationId location id to associate the new program offering.
   * @param programId program id to associate the new program offering.
   * @param educationProgramOffering Information used to create the program offering.
   * @param userId User who creates the offering.
   * @returns Education program offering created.
   */
  async createEducationProgramOffering(
    locationId: number,
    programId: number,
    educationProgramOffering: SaveOfferingModel,
    userId: number,
  ): Promise<EducationProgramOffering> {
    const programOffering = this.populateProgramOffering(
      locationId,
      programId,
      educationProgramOffering,
    );
    programOffering.creator = { id: userId } as User;
    return this.repo.save(programOffering);
  }

  /**
   * This is to fetch all the Education Offering
   * that are associated with the Location and Program
   * @param locationId location id
   * @param programId program id
   * @param offeringTypes offering type
   * @param paginationOptions pagination options
   * @returns offering summary and total offering count
   */
  async getAllEducationProgramOffering(
    locationId: number,
    programId: number,
    paginationOptions: PaginationOptions,
    offeringTypes?: OfferingTypes[],
  ): Promise<PaginatedResults<EducationProgramOfferingModel>> {
    const DEFAULT_SORT_FIELD = "name";
    const offeringsQuery = this.repo
      .createQueryBuilder("offerings")
      .select([
        "offerings.id",
        "offerings.name",
        "offerings.studyStartDate",
        "offerings.studyEndDate",
        "offerings.offeringDelivered",
        "offerings.offeringIntensity",
        "offerings.offeringType",
        "offerings.offeringStatus",
      ])
      .innerJoin("offerings.educationProgram", "educationProgram")
      .innerJoin("offerings.institutionLocation", "institutionLocation")
      .where("educationProgram.id = :programId", { programId })
      .andWhere("institutionLocation.id = :locationId", { locationId });
    if (offeringTypes) {
      offeringsQuery.andWhere("offerings.offeringType in (:...offeringTypes)", {
        offeringTypes,
      });
    }
    // search offering name
    if (paginationOptions.searchCriteria) {
      offeringsQuery.andWhere("offerings.name Ilike :searchCriteria", {
        searchCriteria: `%${paginationOptions.searchCriteria}%`,
      });
    }
    // sorting
    if (paginationOptions.sortField && paginationOptions.sortOrder) {
      offeringsQuery.orderBy(
        sortOfferingsColumnMap(paginationOptions.sortField),
        paginationOptions.sortOrder,
      );
    } else {
      // default sort and order
      offeringsQuery.orderBy(
        sortOfferingsColumnMap(DEFAULT_SORT_FIELD),
        FieldSortOrder.ASC,
      );
    }
    // pagination
    offeringsQuery
      .skip(paginationOptions.page * paginationOptions.pageLimit)
      .take(paginationOptions.pageLimit);

    // result
    const [records, count] = await offeringsQuery.getManyAndCount();
    const offerings = records.map((educationProgramOffering) => {
      const item = new EducationProgramOfferingModel();
      item.id = educationProgramOffering.id;
      item.name = educationProgramOffering.name;
      item.studyStartDate = getISODateOnlyString(
        educationProgramOffering.studyStartDate,
      );
      item.studyEndDate = getISODateOnlyString(
        educationProgramOffering.studyEndDate,
      );
      item.offeringDelivered = educationProgramOffering.offeringDelivered;
      item.offeringIntensity = educationProgramOffering.offeringIntensity;
      item.offeringType = educationProgramOffering.offeringType;
      item.offeringStatus = educationProgramOffering.offeringStatus;
      return item;
    });
    return { results: offerings, count: count };
  }

  /**
   * This is to fetch the Offering
   * that are associated with the Location, Program
   * and given offering id.
   * @param locationId
   * @param programId
   * @param offeringId
   * @param isEditOnly if set to true then fetch offering
   * in status Approved | Declined | Pending.
   * @returns
   */
  async getProgramOffering(
    locationId: number,
    programId: number,
    offeringId: number,
    isEditOnly?: boolean,
  ): Promise<EducationProgramOffering> {
    const offeringQuery = this.repo
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
        "offerings.offeringDelivered",
        "offerings.lacksStudyBreaks",
        "offerings.offeringIntensity",
        "offerings.yearOfStudy",
        "offerings.showYearOfStudy",
        "offerings.hasOfferingWILComponent",
        "offerings.offeringWILType",
        "offerings.studyBreaks",
        "offerings.offeringDeclaration",
        "offerings.offeringType",
        "offerings.assessedDate",
        "offerings.submittedDate",
        "offerings.offeringStatus",
        "offerings.courseLoad",
        "offerings.parentOffering",
        "assessedBy.firstName",
        "assessedBy.lastName",
        "institutionLocation.name",
        "institution.legalOperatingName",
        "institution.operatingName",
      ])
      .innerJoin("offerings.educationProgram", "educationProgram")
      .innerJoin("offerings.institutionLocation", "institutionLocation")
      .innerJoin("institutionLocation.institution", "institution")
      .leftJoin("offerings.assessedBy", "assessedBy")
      .andWhere("offerings.id= :offeringId", {
        offeringId: offeringId,
      })
      .andWhere("educationProgram.id = :programId", {
        programId: programId,
      })
      .andWhere("institutionLocation.id = :locationId", {
        locationId: locationId,
      });

    if (isEditOnly) {
      offeringQuery.andWhere(
        "offerings.offeringStatus IN (:...offeringStatus)",
        {
          offeringStatus: [
            OfferingStatus.Approved,
            OfferingStatus.Pending,
            OfferingStatus.Declined,
          ],
        },
      );
    }
    return offeringQuery.getOne();
  }

  /**
   * Creates a new education program offering at program level
   * @param locationId location id to associate the new program offering.
   * @param programId program id to associate the new program offering.
   * @param educationProgramOffering Information used to create the program offering.
   * @param userId User who updates the offering.
   * @returns Education program offering created.
   */
  async updateEducationProgramOffering(
    locationId: number,
    programId: number,
    offeringId: number,
    educationProgramOffering: SaveOfferingModel,
    userId: number,
  ): Promise<UpdateResult> {
    const hasExistingApplication = await this.hasExistingApplication(
      offeringId,
    );
    const programOffering = this.populateProgramOffering(
      locationId,
      programId,
      educationProgramOffering,
      hasExistingApplication,
    );
    programOffering.modifier = { id: userId } as User;
    return this.repo.update(offeringId, programOffering);
  }

  private populateProgramOffering(
    locationId: number,
    programId: number,
    educationProgramOffering: SaveOfferingModel,
    hasExistingApplication?: boolean,
  ): EducationProgramOffering {
    const programOffering = new EducationProgramOffering();
    programOffering.name = educationProgramOffering.offeringName;
    if (!hasExistingApplication) {
      programOffering.studyStartDate = educationProgramOffering.studyStartDate;
      programOffering.studyEndDate = educationProgramOffering.studyEndDate;
      programOffering.actualTuitionCosts =
        educationProgramOffering.actualTuitionCosts;
      programOffering.programRelatedCosts =
        educationProgramOffering.programRelatedCosts;
      programOffering.mandatoryFees = educationProgramOffering.mandatoryFees;
      programOffering.exceptionalExpenses =
        educationProgramOffering.exceptionalExpenses;
      programOffering.offeringDelivered =
        educationProgramOffering.offeringDelivered;
      programOffering.lacksStudyBreaks =
        educationProgramOffering.lacksStudyBreaks;
      programOffering.offeringType =
        educationProgramOffering.offeringType ?? OfferingTypes.Public;
      programOffering.educationProgram = { id: programId } as EducationProgram;
      programOffering.institutionLocation = {
        id: locationId,
      } as InstitutionLocation;
      programOffering.offeringIntensity =
        educationProgramOffering.offeringIntensity;
      programOffering.yearOfStudy = educationProgramOffering.yearOfStudy;
      programOffering.showYearOfStudy =
        educationProgramOffering.showYearOfStudy;
      programOffering.hasOfferingWILComponent =
        educationProgramOffering.hasOfferingWILComponent;
      programOffering.offeringWILType =
        educationProgramOffering.offeringWILType;
      programOffering.studyBreaks = educationProgramOffering.breaksAndWeeks;
      programOffering.offeringDeclaration =
        educationProgramOffering.offeringDeclaration;
      programOffering.offeringType = educationProgramOffering.offeringType;
      programOffering.courseLoad = educationProgramOffering.courseLoad;
      programOffering.offeringStatus = educationProgramOffering.offeringStatus;
    }
    return programOffering;
  }

  /**
   * Gets program offerings for location.
   * @param programId program id to be filter.
   * @param locationId location id to filter.
   * @param programYearId program id to be filtered.
   * @param offeringsFilter Filter object that wraps all the optional filters that can be
   * added to the service.
   * @param includeInActivePY includeInActivePY, if includeInActivePY, then both active
   * and not active program year is considered.
   * @returns program offerings for location.
   */
  async getProgramOfferingsForLocation(
    locationId: number,
    programId: number,
    programYearId: number,
    offeringsFilter: OfferingsFilter,
    includeInActivePY?: boolean,
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
      .andWhere("programs.programStatus = :programStatus", {
        programStatus: ProgramStatus.Approved,
      })
      .andWhere("offerings.institutionLocation.id = :locationId", {
        locationId,
      })
      .andWhere("offerings.offeringType IN (:...offeringTypes)", {
        offeringTypes: offeringsFilter.offeringTypes,
      })
      .andWhere(
        "offerings.studyStartDate BETWEEN programYear.startDate AND programYear.endDate",
      );
    if (offeringsFilter.offeringIntensity) {
      query.andWhere("offerings.offeringIntensity = :offeringIntensity", {
        offeringIntensity: offeringsFilter.offeringIntensity,
      });
    }
    if (offeringsFilter.offeringStatus) {
      query.andWhere("offerings.offeringStatus = :offeringStatus", {
        offeringStatus: offeringsFilter.offeringStatus,
      });
    }
    if (!includeInActivePY) {
      query.andWhere("programYear.active = true");
    }
    return query.orderBy("offerings.name").getMany();
  }

  /**
   * Gets location id from an offering.
   * @param offeringId offering id.
   * @returns offering location id.
   */
  async getOfferingLocationId(
    offeringId: number,
  ): Promise<EducationProgramOffering> {
    return this.repo
      .createQueryBuilder("offerings")
      .select([
        "location.id",
        "offerings.studyStartDate",
        "offerings.studyEndDate",
        "offerings.offeringIntensity",
      ])
      .innerJoin("offerings.institutionLocation", "location")
      .where("offerings.id = :offeringId", { offeringId })
      .getOne();
  }

  /**
   * Gets location id from an offering.
   * @param offeringId offering id.
   * @returns offering object.
   */
  async getOfferingById(offeringId: number): Promise<EducationProgramOffering> {
    return this.repo
      .createQueryBuilder("offering")
      .select([
        "offering.id",
        "offering.name",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.mandatoryFees",
        "offering.exceptionalExpenses",
        "offering.offeringDelivered",
        "offering.lacksStudyBreaks",
        "offering.offeringIntensity",
        "offering.yearOfStudy",
        "offering.showYearOfStudy",
        "offering.hasOfferingWILComponent",
        "offering.offeringWILType",
        "offering.studyBreaks",
        "offering.offeringDeclaration",
        "offering.offeringType",
        "offering.assessedDate",
        "offering.submittedDate",
        "offering.courseLoad",
        "offering.offeringStatus",
        "assessedBy.firstName",
        "assessedBy.lastName",
        "institutionLocation.name",
        "institution.id",
        "institution.legalOperatingName",
        "institution.operatingName",
      ])
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .innerJoin("institutionLocation.institution", "institution")
      .leftJoin("offering.assessedBy", "assessedBy")
      .where("offering.id= :offeringId", {
        offeringId,
      })
      .getOne();
  }

  /**
   * Assess offering to either approve or decline it.
   * @param offeringId
   * @param institutionId
   * @param userId
   * @param assessmentNotes
   * @param offeringStatus
   */
  async assessOffering(
    offeringId: number,
    institutionId: number,
    userId: number,
    assessmentNotes: string,
    offeringStatus: OfferingStatus,
  ): Promise<void> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // create the note for assessment.
      const user = {
        id: userId,
      } as User;
      const note = new Note();
      note.description = assessmentNotes;
      note.noteType = NoteType.Program;
      note.creator = user;
      const noteEntity = await transactionalEntityManager
        .getRepository(Note)
        .save(note);

      // update offering.
      const offering = new EducationProgramOffering();
      offering.id = offeringId;
      offering.offeringStatus = offeringStatus;
      offering.assessedDate = new Date();
      offering.assessedBy = user;
      offering.offeringNote = noteEntity;

      await transactionalEntityManager
        .getRepository(EducationProgramOffering)
        .save(offering);

      // update institution note.
      await transactionalEntityManager
        .getRepository(Institution)
        .createQueryBuilder()
        .relation(Institution, "notes")
        .of({ id: institutionId } as Institution)
        .add(noteEntity);
    });
  }

  /**
   * Check if a program has at least one offering.
   * @param programId program id.
   * @returns true, if a program has existing offering.
   */
  async hasExistingOffering(programId: number): Promise<boolean> {
    const offeringExists = await this.repo
      .createQueryBuilder("offerings")
      .select("1")
      .where("offerings.educationProgram.id = :programId", { programId })
      .limit(1)
      .getRawOne();
    return !!offeringExists;
  }

  /**
   * Check if the given offering has any submitted applications.
   * @param offeringId
   * @returns true if an offering has any assessment
   */
  async hasExistingApplication(offeringId: number): Promise<boolean> {
    const queryResult = await this.dataSource
      .getRepository(StudentAssessment)
      .createQueryBuilder("assessment")
      .select("1")
      .where("assessment.offering.id = :offeringId", { offeringId })
      .limit(1)
      .getRawOne();
    return !!queryResult;
  }

  /**
   * Request a change to offering to modify it's
   * properties that affect the assessment of student application.
   ** During this process a new offering is created by copying the existing
   * offering and modifying the properties required.
   * @param locationId Offering location.
   * @param programId Program of the offering.
   * @param offeringId
   * @param userId User who requests change to the offering.
   * @param educationProgramOffering
   * @returns new offering created from existing offering with changes requested.
   */
  async requestChange(
    locationId: number,
    programId: number,
    offeringId: number,
    userId: number,
    educationProgramOffering: SaveOfferingModel,
  ): Promise<EducationProgramOffering> {
    const currentOffering = await this.getApprovedOfferingToRequestChange(
      locationId,
      programId,
      offeringId,
    );

    if (!currentOffering) {
      throw new CustomNamedError(
        "Either offering for given location and program not found or the offering not in appropriate status to be requested for change.",
        OFFERING_NOT_VALID,
      );
    }

    const requestedOffering = this.populateProgramOffering(
      locationId,
      programId,
      educationProgramOffering,
    );
    const auditUser = { id: userId } as User;
    const precedingOffering = {
      id: currentOffering.id,
    } as EducationProgramOffering;
    //Populating the status, parent offering and audit fields.
    requestedOffering.offeringStatus = OfferingStatus.AwaitingApproval;
    requestedOffering.parentOffering =
      currentOffering.parentOffering ?? precedingOffering;
    requestedOffering.precedingOffering = precedingOffering;
    requestedOffering.creator = auditUser;

    //Update the status and audit details of current offering.
    const underReviewOffering = new EducationProgramOffering();
    underReviewOffering.id = offeringId;
    underReviewOffering.offeringStatus = OfferingStatus.UnderReview;
    underReviewOffering.modifier = auditUser;

    await this.repo.save([underReviewOffering, requestedOffering]);
    return requestedOffering;
  }

  /**
   * Get the offering to request change.
   * Offering in Approved status alone can be requested for change.
   * @param locationId
   * @param programId
   * @param offeringId
   * @returns offering.
   */
  async getApprovedOfferingToRequestChange(
    locationId: number,
    programId: number,
    offeringId: number,
  ): Promise<EducationProgramOffering> {
    return this.repo
      .createQueryBuilder("offerings")
      .select(["offerings.id", "offerings.parentOffering"])
      .where("offerings.id = :offeringId", {
        offeringId: offeringId,
      })
      .andWhere("offerings.offeringStatus = :offeringStatus", {
        offeringStatus: OfferingStatus.Approved,
      })
      .andWhere("offerings.educationProgram.id = :programId", {
        programId: programId,
      })
      .andWhere("offerings.institutionLocation.id = :locationId", {
        locationId: locationId,
      })
      .getOne();
  }

  /**
   * Get all offerings that were were requested for change
   * i.e in Awaiting Approval status.
   * @returns all offerings that were requested for change.
   */
  async getOfferingChangeRequests(): Promise<EducationProgramOffering[]> {
    return this.repo
      .createQueryBuilder("offerings")
      .select([
        "offerings.id",
        "offerings.name",
        "offerings.submittedDate",
        "offerings.precedingOffering",
        "precedingOffering.id",
        "educationProgram.id",
        "institutionLocation.name",
        "institution.legalOperatingName",
        "institution.operatingName",
      ])
      .innerJoin("offerings.educationProgram", "educationProgram")
      .innerJoin("offerings.precedingOffering", "precedingOffering")
      .innerJoin("offerings.institutionLocation", "institutionLocation")
      .innerJoin("institutionLocation.institution", "institution")
      .where("offerings.offeringStatus = :offeringStatus", {
        offeringStatus: OfferingStatus.AwaitingApproval,
      })
      .getMany();
  }

  /**
   * Gets preceding offering details of the actual offering.
   * @param offeringId offering id of actual offering.
   * @returns offering object.
   */
  async getPrecedingOfferingByActualOfferingId(
    offeringId: number,
  ): Promise<EducationProgramOffering> {
    return this.repo
      .createQueryBuilder("offering")
      .select([
        "offering.id",
        "precedingOffering.id",
        "precedingOffering.name",
        "precedingOffering.studyStartDate",
        "precedingOffering.studyEndDate",
        "precedingOffering.actualTuitionCosts",
        "precedingOffering.programRelatedCosts",
        "precedingOffering.mandatoryFees",
        "precedingOffering.exceptionalExpenses",
        "precedingOffering.offeringDelivered",
        "precedingOffering.lacksStudyBreaks",
        "precedingOffering.offeringIntensity",
        "precedingOffering.yearOfStudy",
        "precedingOffering.showYearOfStudy",
        "precedingOffering.hasOfferingWILComponent",
        "precedingOffering.offeringWILType",
        "precedingOffering.studyBreaks",
        "precedingOffering.offeringDeclaration",
        "precedingOffering.offeringType",
        "precedingOffering.assessedDate",
        "precedingOffering.submittedDate",
        "precedingOffering.courseLoad",
        "precedingOffering.offeringStatus",
        "assessedBy.firstName",
        "assessedBy.lastName",
        "institutionLocation.name",
        "institution.id",
        "institution.legalOperatingName",
        "institution.operatingName",
      ])
      .innerJoin("offering.precedingOffering", "precedingOffering")
      .innerJoin("precedingOffering.educationProgram", "educationProgram")
      .innerJoin("precedingOffering.institutionLocation", "institutionLocation")
      .innerJoin("institutionLocation.institution", "institution")
      .leftJoin("precedingOffering.assessedBy", "assessedBy")
      .where("offering.id= :offeringId", {
        offeringId,
      })
      .getOne();
  }
}
