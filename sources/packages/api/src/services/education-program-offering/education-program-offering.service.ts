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
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
} from "../../database/entities";
import { RecordDataModelService } from "../../database/data.model.service";
import { WorkflowActionsService } from "../workflow/workflow-actions.service";
import { WorkflowStartResult } from "../workflow/workflow.models";
import * as os from "os";
import { DataSource, UpdateResult } from "typeorm";
import {
  EducationProgramOfferingModel,
  SaveOfferingModel,
  OfferingsFilter,
  PrecedingOfferingSummaryModel,
  ApplicationAssessmentSummary,
} from "./education-program-offering.service.models";
import { ProgramYear } from "../../database/entities/program-year.model";
import {
  FieldSortOrder,
  sortOfferingsColumnMap,
  PaginationOptions,
  PaginatedResults,
  getISODateOnlyString,
  CustomNamedError,
  mapFromRawAndEntities,
} from "../../utilities";
import { OFFERING_NOT_VALID } from "../../constants";

@Injectable()
export class EducationProgramOfferingService extends RecordDataModelService<EducationProgramOffering> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly workflowActionsService: WorkflowActionsService,
  ) {
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
   * Get offering details by offering id.
   * If isPrecedingOffering is supplied then retrieve the preceding offering details.
   * @param offeringId offering id.
   * @param isPrecedingOffering when true preceding offering details are retrieved.
   * @returns offering object.
   */
  async getOfferingById(
    offeringId: number,
    isPrecedingOffering?: boolean,
  ): Promise<EducationProgramOffering> {
    const offeringQuery = this.repo
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
      .leftJoin("offering.assessedBy", "assessedBy");

    if (isPrecedingOffering) {
      offeringQuery
        .where((qb) => {
          const subQuery = qb
            .subQuery()
            .select("precedingOffering.id")
            .from(EducationProgramOffering, "offering")
            .innerJoin("offering.precedingOffering", "precedingOffering")
            .where("offering.id = :offeringId")
            .getSql();
          return `offering.id = ${subQuery}`;
        })
        .setParameter("offeringId", offeringId);
    } else {
      offeringQuery.where("offering.id= :offeringId", {
        offeringId,
      });
    }

    return offeringQuery.getOne();
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
    const currentOffering = await this.getOfferingToRequestChange(
      offeringId,
      OfferingStatus.Approved,
      programId,
      locationId,
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
    //The parent offering will be just the preceding offering if
    //the change is requested only once.
    //Otherwise parent offering will be the very first offering where change was requested.
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
   * @param offeringId offering requested for change.
   * @param offeringStatus status of the approval.
   * @param programId program of the offering.
   * @param locationId location of the offering.
   * @returns offering.
   */
  async getOfferingToRequestChange(
    offeringId: number,
    offeringStatus: OfferingStatus,
    programId?: number,
    locationId?: number,
  ): Promise<EducationProgramOffering> {
    const offeringSummaryQuery = this.repo
      .createQueryBuilder("offerings")
      .select([
        "offerings.id",
        "parentOffering.id",
        "precedingOffering.id",
        "location.id",
        "institution.id",
      ])
      .innerJoin("offerings.institutionLocation", "location")
      .innerJoin("location.institution", "institution")
      .leftJoin("offerings.parentOffering", "parentOffering")
      .leftJoin("offerings.precedingOffering", "precedingOffering")
      .where("offerings.id = :offeringId", {
        offeringId: offeringId,
      })
      .andWhere("offerings.offeringStatus = :offeringStatus", {
        offeringStatus,
      });

    if (programId) {
      offeringSummaryQuery.andWhere(
        "offerings.educationProgram.id = :programId",
        {
          programId: programId,
        },
      );
    }

    if (locationId) {
      offeringSummaryQuery.andWhere(
        "offerings.institutionLocation.id = :locationId",
        {
          locationId: locationId,
        },
      );
    }

    return offeringSummaryQuery.getOne();
  }

  /**
   * Get all offerings that were requested for change
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
        "educationProgram.id",
        "institutionLocation.name",
        "institution.legalOperatingName",
        "institution.operatingName",
      ])
      .innerJoin("offerings.educationProgram", "educationProgram")
      .innerJoin("offerings.institutionLocation", "institutionLocation")
      .innerJoin("institutionLocation.institution", "institution")
      .where("offerings.offeringStatus = :offeringStatus", {
        offeringStatus: OfferingStatus.AwaitingApproval,
      })
      .getMany();
  }

  /**
   * For a given offering which is requested as change
   * get the summary of it's actual(preceding) offering.
   * @param offeringId offering id of actual offering.
   * @returns preceding offering summary.
   */
  async getPrecedingOfferingSummary(
    offeringId: number,
  ): Promise<PrecedingOfferingSummaryModel> {
    const query = this.dataSource
      .getRepository(Application)
      .createQueryBuilder("application")
      .select("count(application.id)", "applicationsCount")
      .innerJoin("application.currentAssessment", "assessment")
      .innerJoin(
        EducationProgramOffering,
        "offering",
        "offering.precedingOffering.id = assessment.offering.id",
      )
      .where(
        "application.applicationStatus NOT IN (:...invalidOfferingChangeStatus)",
        {
          invalidOfferingChangeStatus: [
            ApplicationStatus.cancelled,
            ApplicationStatus.overwritten,
          ],
        },
      )
      .andWhere("offering.id = :offeringId", { offeringId });

    const precedingOffering = await query.getRawOne();

    return {
      applicationsCount: +precedingOffering?.applicationsCount,
    };
  }

  /**
   * Get applications that are impacted by an offering change
   * to submit reassessment.
   * @param offeringId offering requested for change.
   * @returns applications.
   */
  async getApplicationsToSubmitReassessment(
    offeringId: number,
  ): Promise<ApplicationAssessmentSummary[]> {
    const applications = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder("application")
      .select("application.id")
      .addSelect("assessment.id")
      .addSelect("assessment.assessmentData IS NULL", "hasAssessmentData")
      .addSelect("application.data->>'workflowName'", "workflowName")
      .addSelect("assessment.assessmentWorkflowId", "assessmentWorkflowId")
      .innerJoin("application.currentAssessment", "assessment")
      .innerJoin(
        EducationProgramOffering,
        "offering",
        "offering.precedingOffering.id = assessment.offering.id",
      )
      .where(
        "application.applicationStatus NOT IN (:...invalidOfferingChangeStatus)",
        {
          invalidOfferingChangeStatus: [
            ApplicationStatus.cancelled,
            ApplicationStatus.overwritten,
          ],
        },
      )
      .andWhere("offering.id = :offeringId", { offeringId })
      .getRawAndEntities();
    return mapFromRawAndEntities<ApplicationAssessmentSummary>(
      applications,
      "workflowName",
      "assessmentWorkflowId",
      "hasAssessmentData",
    );
  }

  /**
   * Approve or Decline an offering change
   * requested by institution.
   * @param offeringId offering that is requested for change.
   * @param userId User who approves or declines the offering.
   * @param assessmentNotes Notes added during the process.
   * @param offeringStatus Approval or Decline status.
   */
  async assessOfferingChangeRequest(
    offeringId: number,
    userId: number,
    assessmentNotes: string,
    offeringStatus: OfferingStatus,
  ): Promise<void> {
    const requestedOffering = await this.getOfferingToRequestChange(
      offeringId,
      OfferingStatus.AwaitingApproval,
    );

    if (!requestedOffering) {
      throw new CustomNamedError(
        "Either offering not found or the offering not in appropriate status to be approved or declined for change.",
        OFFERING_NOT_VALID,
      );
    }

    if (!requestedOffering.precedingOffering) {
      throw new CustomNamedError(
        "The offering requested for change does not have a preceding offering.",
        OFFERING_NOT_VALID,
      );
    }
    const precedingOffering = requestedOffering.precedingOffering;
    const auditUser = { id: userId } as User;
    const currentDate = new Date();
    // Set audit fields.
    requestedOffering.modifier = auditUser;
    requestedOffering.updatedAt = currentDate;
    requestedOffering.assessedBy = auditUser;
    requestedOffering.assessedDate = currentDate;

    precedingOffering.modifier = auditUser;
    precedingOffering.updatedAt = currentDate;
    precedingOffering.assessedBy = auditUser;
    precedingOffering.assessedDate = currentDate;
    let applications: ApplicationAssessmentSummary[] = [];

    // Populate the status accordingly and get impacted applications
    // when the offering change is approved.
    if (offeringStatus === OfferingStatus.Approved) {
      requestedOffering.offeringStatus = OfferingStatus.Approved;
      precedingOffering.offeringStatus = OfferingStatus.ChangeOverwritten;
      applications = await this.getApplicationsToSubmitReassessment(offeringId);

      for (const application of applications) {
        application.currentAssessment = {
          application: { id: application.id } as Application,
          triggerType: AssessmentTriggerType.OfferingChange,
          offering: { id: offeringId } as EducationProgramOffering,
          creator: auditUser,
          createdAt: currentDate,
          submittedBy: auditUser,
          submittedDate: currentDate,
        } as StudentAssessment;
        application.modifier = auditUser;
        application.updatedAt = currentDate;
      }
    } else {
      requestedOffering.offeringStatus = OfferingStatus.ChangeDeclined;
      precedingOffering.offeringStatus = OfferingStatus.Approved;
    }

    await this.dataSource.transaction(async (transactionalEntityManager) => {
      // Create the note for assessment.
      const note = new Note();
      note.description = assessmentNotes;
      note.noteType = NoteType.Program;
      note.creator = auditUser;
      const noteEntity = await transactionalEntityManager
        .getRepository(Note)
        .save(note);

      // Update note.
      requestedOffering.offeringNote = noteEntity;

      // Update institution note.
      await transactionalEntityManager
        .getRepository(Institution)
        .createQueryBuilder()
        .relation(Institution, "notes")
        .of({
          id: requestedOffering.institutionLocation.institution.id,
        } as Institution)
        .add(noteEntity);

      // Save the requested and preceding offering.
      await transactionalEntityManager
        .getRepository(EducationProgramOffering)
        .save([requestedOffering, precedingOffering]);

      // Save applications with new current assessment on approval.
      if (applications?.length > 0) {
        await transactionalEntityManager
          .getRepository(Application)
          .save(applications);
      }
    });

    // Once the impacted applications are updated with new current assessment
    // start the assessment workflows and delete the existing workflow instances.
    if (applications?.length > 0) {
      await this.startOfferingChangeAssessments(applications);
    }
  }

  /**
   * For an offering change start the assessment workflows for all new assessments
   * and delete the existing workflow instances of previous assessments.
   * @param applications applications impacted by offering change.
   */
  private async startOfferingChangeAssessments(
    applications: ApplicationAssessmentSummary[],
  ): Promise<void> {
    const promises: Promise<void | WorkflowStartResult>[] = [];
    // Used to limit the number of asynchronous operations
    // that will start at the same time based on length of cpus.
    // TODO: Currently the parallel processing is limited logical CPU core count but this approach
    // TODO: needs to be revisited.
    const maxPromisesAllowed = os.cpus().length;
    for (const application of applications) {
      // When the assessment data is populated, the workflow is complete.
      // Only running workflow instances can be deleted.
      if (application.assessmentWorkflowId && !application.hasAssessmentData) {
        const deleteAssessmentPromise =
          this.workflowActionsService.deleteApplicationAssessment(
            application.assessmentWorkflowId,
          );
        promises.push(deleteAssessmentPromise);
      }
      const startAssessmentPromise =
        this.workflowActionsService.startApplicationAssessment(
          application.workflowName,
          application.currentAssessment.id,
        );
      promises.push(startAssessmentPromise);
      if (promises.length >= maxPromisesAllowed) {
        // Waits for promises to be process when it reaches maximum allowable parallel
        // count.
        await Promise.all(promises);
        promises.splice(0, promises.length);
      }
    }
    // Processing any pending promise if not completed.
    await Promise.all(promises);
  }
}
