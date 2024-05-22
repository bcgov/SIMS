import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
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
  StudyBreak,
  ProgramYear,
  DatabaseConstraintNames,
  StudentAssessmentStatus,
  StudyBreaksAndWeeks,
  isDatabaseConstraintError,
} from "@sims/sims-db";
import {
  DataSource,
  EntityManager,
  In,
  Repository,
  UpdateResult,
} from "typeorm";
import {
  OfferingsFilter,
  PrecedingOfferingSummaryModel,
  EducationProgramOfferingBasicData,
  EducationProgramOfferingNotification,
} from "./education-program-offering.service.models";
import {
  sortOfferingsColumnMap,
  PaginationOptions,
  PaginatedResults,
  OFFERING_STUDY_BREAK_MAX_DAYS,
  OFFERING_VALIDATIONS_STUDY_BREAK_COMBINED_PERCENTAGE_THRESHOLD,
} from "../../utilities";
import {
  CustomNamedError,
  dateDifference,
  decimalRound,
  FieldSortOrder,
  isBeforeDate,
  isBetweenPeriod,
} from "@sims/utilities";
import {
  OFFERING_SAVE_UNIQUE_ERROR,
  OFFERING_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  OFFERING_NOT_VALID,
} from "../../constants";
import {
  CalculatedStudyBreaksAndWeeks,
  CreateFromValidatedOfferingError,
  CreateValidatedOfferingResult,
  OfferingStudyBreakCalculationContext,
  OfferingValidationResult,
  OfferingValidationModel,
  OfferingDeliveryOptions,
  WILComponentOptions,
} from "./education-program-offering-validation.models";
import { EducationProgramOfferingValidationService } from "./education-program-offering-validation.service";
import * as os from "os";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  InstitutionAddsPendingOfferingNotification,
  NotificationActionsService,
} from "@sims/services";

@Injectable()
export class EducationProgramOfferingService extends RecordDataModelService<EducationProgramOffering> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly offeringValidationService: EducationProgramOfferingValidationService,
    private readonly notificationActionsService: NotificationActionsService,
  ) {
    super(dataSource.getRepository(EducationProgramOffering));
  }

  /**
   * Creates a new education program offering at program level and saves a notification
   * for the ministry as a part of the same transaction.
   * @param educationProgramOffering Information used to create the program offering.
   * @param userId User who creates the offering.
   * @returns Education program offering created.
   */
  async createEducationProgramOffering(
    educationProgramOffering: OfferingValidationModel,
    userId: number,
  ): Promise<EducationProgramOffering> {
    const offeringValidation =
      this.offeringValidationService.validateOfferingModel(
        educationProgramOffering,
      );
    const programOffering = this.populateProgramOffering(
      offeringValidation.offeringModel,
    );
    programOffering.offeringStatus = offeringValidation.offeringStatus;
    programOffering.creator = { id: userId } as User;
    // When creating a new offering, parent id and the primary id are the same.
    programOffering.parentOffering = programOffering;
    const educationProgramOfferingNotificationData = {
      offeringName: educationProgramOffering.offeringName,
      programName: educationProgramOffering.programContext.name,
      operatingName: educationProgramOffering.operatingName,
      legalOperatingName: educationProgramOffering.legalOperatingName,
      primaryEmail: educationProgramOffering.primaryEmail,
      programOfferingStatus: programOffering.offeringStatus,
      institutionLocationName: educationProgramOffering.locationName,
    };
    try {
      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          await this.saveEducationProgramOfferingNotification(
            educationProgramOfferingNotificationData,
            transactionalEntityManager,
          );
          return await transactionalEntityManager
            .getRepository(EducationProgramOffering)
            .save(programOffering);
        },
      );
    } catch (error: unknown) {
      if (
        isDatabaseConstraintError(
          error,
          DatabaseConstraintNames.LocationIDProgramIDOfferingNameStudyDatesYearOfStudyIndex,
        )
      ) {
        throw new CustomNamedError(
          "Duplication error. An offering with the same name, year of study, start date and end date was found.",
          OFFERING_SAVE_UNIQUE_ERROR,
        );
      }
      throw error;
    }
  }

  /**
   * Create offerings from already successfully validated models and
   * insert all offerings in a DB transaction.
   * If a database level error happen it will abort the entire transaction and
   * the specific error will be returned to inform the user.
   * @param validatedOfferings successfully validated offering models.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns result object for all the offering models.
   */
  async createFromValidatedOfferings(
    validatedOfferings: OfferingValidationResult[],
    auditUserId: number,
  ): Promise<CreateValidatedOfferingResult[]> {
    return this.dataSource.transaction(async (entityManager) => {
      const offeringRepo = entityManager.getRepository(
        EducationProgramOffering,
      );
      // Used to limit the number of asynchronous operations
      // that will start at the same time.
      const maxPromisesAllowed = os.cpus().length;
      // Hold all the promises that must be processed.
      const promises: Promise<CreateValidatedOfferingResult>[] = [];
      const notificationPromises: Promise<void>[] = [];
      const allResults: CreateValidatedOfferingResult[] = [];
      for (const validatedOffering of validatedOfferings) {
        promises.push(
          this.createFromValidatedOffering(
            validatedOffering,
            offeringRepo,
            auditUserId,
          ),
        );
        const educationProgramOfferingNotificationData = {
          offeringName: validatedOffering.offeringModel.offeringName,
          programName: validatedOffering.offeringModel.programContext.name,
          operatingName: validatedOffering.offeringModel.operatingName,
          legalOperatingName:
            validatedOffering.offeringModel.legalOperatingName,
          primaryEmail: validatedOffering.offeringModel.primaryEmail,
          programOfferingStatus: validatedOffering.offeringStatus,
          institutionLocationName: validatedOffering.offeringModel.locationName,
        };
        notificationPromises.push(
          this.saveEducationProgramOfferingNotification(
            educationProgramOfferingNotificationData,
            entityManager,
          ),
        );
        if (promises.length >= maxPromisesAllowed) {
          // Waits for all be processed.
          const insertResults = await Promise.all(promises);
          await Promise.all(notificationPromises);
          const newOfferings = insertResults.map(
            (result) => result.createdOfferingId,
          );
          await this.saveBulkOfferingParentId(newOfferings, offeringRepo);
          allResults.push(...insertResults);
          // Clear the array.
          promises.length = 0;
        }
      }
      const finalResults = await Promise.all(promises);
      await Promise.all(notificationPromises);
      const newOfferings = finalResults.map(
        (result) => result.createdOfferingId,
      );
      await this.saveBulkOfferingParentId(newOfferings, offeringRepo);
      allResults.push(...finalResults);
      return allResults;
    });
  }

  /**
   * Creates a ministry notification for the saved education
   * program offering as a part of the same transaction.
   * @param notificationData notification data required to create the notification.
   * @param entityManager entity manager to be part of the transaction.
   */
  private async saveEducationProgramOfferingNotification(
    notificationData: EducationProgramOfferingNotification,
    entityManager: EntityManager,
  ): Promise<void> {
    if (
      notificationData.programOfferingStatus !== OfferingStatus.CreationPending
    ) {
      return;
    }
    const ministryNotification: InstitutionAddsPendingOfferingNotification = {
      institutionName: notificationData.legalOperatingName,
      institutionOperatingName: notificationData.operatingName,
      institutionLocationName: notificationData.institutionLocationName,
      programName: notificationData.programName,
      offeringName: notificationData.offeringName,
      institutionPrimaryEmail: notificationData.primaryEmail,
    };
    await this.notificationActionsService.saveInstitutionAddsPendingOfferingNotification(
      ministryNotification,
      entityManager,
    );
  }

  /**
   * Update offering parent ids for given offerings.
   * When creating a new offering, parent id and
   * the primary id are the same.
   * @param newOfferings list of newly created offerings.
   * @param offeringRepo offering repo
   * @returns update result.
   */
  private async saveBulkOfferingParentId(
    newOfferings: number[],
    offeringRepo: Repository<EducationProgramOffering>,
  ): Promise<UpdateResult> {
    try {
      return await offeringRepo.update(
        {
          id: In(newOfferings),
        },
        {
          parentOffering: {
            id: () => "id",
          },
        },
      );
    } catch (error: unknown) {
      if (
        isDatabaseConstraintError(
          error,
          DatabaseConstraintNames.LocationIDProgramIDOfferingNameStudyDatesYearOfStudyIndex,
        )
      ) {
        throw new CustomNamedError(
          "Duplication error. An offering with the same name, year of study, start date and end date was found.",
          OFFERING_SAVE_UNIQUE_ERROR,
        );
      }
      throw error;
    }
  }

  /**
   * Tries to execute the offering insert and provides a successful object
   * or an exception with information to be used to create an error result.
   * @param validatedOffering successfully validated offering to be inserted.
   * @param offeringRepo repository to be used to execute the insert operations
   * sharing the same transaction.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns successful object or an exception with information to be used to create an error result.
   */
  private async createFromValidatedOffering(
    validatedOffering: OfferingValidationResult,
    offeringRepo: Repository<EducationProgramOffering>,
    auditUserId: number,
  ): Promise<CreateValidatedOfferingResult> {
    const programOffering = this.populateProgramOffering(
      validatedOffering.offeringModel,
    );
    programOffering.offeringStatus = validatedOffering.offeringStatus;
    programOffering.creator = { id: auditUserId } as User;
    try {
      const insertResult = await offeringRepo.insert(programOffering);
      const [createdIdentifier] = insertResult.identifiers;
      const createdOfferingId = +createdIdentifier.id;
      return { validatedOffering, createdOfferingId };
    } catch (error: unknown) {
      if (
        isDatabaseConstraintError(
          error,
          DatabaseConstraintNames.LocationIDProgramIDOfferingNameStudyDatesYearOfStudyIndex,
        )
      ) {
        throw new CreateFromValidatedOfferingError(
          validatedOffering,
          "Duplication error. An offering with the same name, year of study, start date and end date was found. Please remove the duplicate offering and try again.",
        );
      }

      this.logger.error(
        `Unexpected error while creating offering from bulk insert. Offering data: ${JSON.stringify(
          validatedOffering.offeringModel,
        )}. ${error} `,
      );
      throw new CreateFromValidatedOfferingError(
        validatedOffering,
        "There was an unexpected error during the offering bulk insert and it was not possible to create the record, please contact support.",
      );
    }
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
  ): Promise<PaginatedResults<EducationProgramOffering>> {
    const DEFAULT_SORT_FIELD = "name";
    const offeringsQuery = this.repo
      .createQueryBuilder("offerings")
      .select([
        "offerings.id",
        "offerings.name",
        "offerings.yearOfStudy",
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
    return { results: records, count: count };
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
        "parentOffering.id",
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
        "educationProgram.isActive",
        "educationProgram.effectiveEndDate",
      ])
      .innerJoin("offerings.educationProgram", "educationProgram")
      .innerJoin("offerings.institutionLocation", "institutionLocation")
      .innerJoin("institutionLocation.institution", "institution")
      .leftJoin("offerings.assessedBy", "assessedBy")
      .innerJoin("offerings.parentOffering", "parentOffering")
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
            OfferingStatus.CreationPending,
            OfferingStatus.CreationDeclined,
          ],
        },
      );
    }
    return offeringQuery.getOne();
  }

  /**
   * Updates basic offering data that does not affect the assessment
   * and does not require the complete offering validation.
   * @param offeringId id of the offering to be updated.
   * @param basicOfferingData information to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns Education program offering created.
   */
  async updateEducationProgramOfferingBasicData(
    offeringId: number,
    basicOfferingData: EducationProgramOfferingBasicData,
    auditUserId: number,
  ): Promise<UpdateResult> {
    return this.repo.update(offeringId, {
      name: basicOfferingData.offeringName,
      modifier: { id: auditUserId } as User,
    });
  }

  /**
   * Creates a new education program offering at program level
   * @param educationProgramOffering Information used to create the program offering.
   * @param userId User who updates the offering.
   * @returns Education program offering created.
   */
  async updateEducationProgramOffering(
    offeringId: number,
    educationProgramOffering: OfferingValidationModel,
    userId: number,
  ): Promise<UpdateResult> {
    const offeringValidation =
      this.offeringValidationService.validateOfferingModel(
        educationProgramOffering,
      );
    const hasExistingApplication = await this.hasExistingApplication(
      offeringId,
    );
    if (hasExistingApplication) {
      throw new CustomNamedError(
        "The offering cannot be updated because it is already associated with some assessment.",
        OFFERING_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }
    const programOffering = this.populateProgramOffering(
      offeringValidation.offeringModel,
    );
    programOffering.offeringStatus = offeringValidation.offeringStatus;
    programOffering.modifier = { id: userId } as User;
    const educationProgramOfferingNotificationData = {
      offeringName: educationProgramOffering.offeringName,
      programName: educationProgramOffering.programContext.name,
      operatingName: educationProgramOffering.operatingName,
      legalOperatingName: educationProgramOffering.legalOperatingName,
      primaryEmail: educationProgramOffering.primaryEmail,
      programOfferingStatus: programOffering.offeringStatus,
      institutionLocationName: educationProgramOffering.locationName,
    };
    try {
      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          await this.saveEducationProgramOfferingNotification(
            educationProgramOfferingNotificationData,
            transactionalEntityManager,
          );
          return transactionalEntityManager
            .getRepository(EducationProgramOffering)
            .update(offeringId, programOffering);
        },
      );
    } catch (error: unknown) {
      if (
        isDatabaseConstraintError(
          error,
          DatabaseConstraintNames.LocationIDProgramIDOfferingNameStudyDatesYearOfStudyIndex,
        )
      ) {
        throw new CustomNamedError(
          "Duplication error. An offering with the same name, year of study, start date and end date was found.",
          OFFERING_SAVE_UNIQUE_ERROR,
        );
      }
      throw error;
    }
  }

  private populateProgramOffering(
    educationProgramOffering: OfferingValidationModel,
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
    programOffering.offeringDelivered =
      educationProgramOffering.offeringDelivered;
    programOffering.lacksStudyBreaks =
      educationProgramOffering.lacksStudyBreaks;
    programOffering.offeringType =
      educationProgramOffering.offeringType ?? OfferingTypes.Public;
    programOffering.educationProgram = {
      id: educationProgramOffering.programContext.id,
    } as EducationProgram;
    programOffering.institutionLocation = {
      id: educationProgramOffering.locationId,
    } as InstitutionLocation;
    programOffering.offeringIntensity =
      educationProgramOffering.offeringIntensity;
    programOffering.yearOfStudy = educationProgramOffering.yearOfStudy;
    programOffering.hasOfferingWILComponent =
      educationProgramOffering.hasOfferingWILComponent;
    programOffering.offeringWILType =
      educationProgramOffering.offeringWILComponentType;
    programOffering.offeringDeclaration =
      educationProgramOffering.offeringDeclaration;
    programOffering.offeringType = educationProgramOffering.offeringType;
    programOffering.courseLoad = educationProgramOffering.courseLoad;
    // Study Breaks calculation.
    const calculatedBreaks =
      EducationProgramOfferingService.getCalculatedStudyBreaksAndWeeks(
        educationProgramOffering,
      );
    programOffering.studyBreaks =
      EducationProgramOfferingService.assignStudyBreaks(calculatedBreaks);

    return programOffering;
  }

  /**
   * Retrieves from the database the offering data needed
   * to perform all the validations, process the validation
   * and return its result.
   * @param offeringId offering id.
   * @returns offering validation result.
   */
  async validateOfferingById(
    offeringId: number,
  ): Promise<OfferingValidationResult> {
    const validationModel = await this.createValidationModelFromOfferingId(
      offeringId,
    );
    return this.offeringValidationService.validateOfferingModel(
      validationModel,
      true,
    );
  }

  /**
   * Converts an offering entity model to the validation model.
   * @param offeringId offering id.
   * @returns offering validation model.
   */
  private async createValidationModelFromOfferingId(
    offeringId: number,
  ): Promise<OfferingValidationModel> {
    const offering = await this.getOfferingForValidation(offeringId);
    if (!offering) {
      throw new Error("Offering was not found.");
    }
    const offeringValidationModel = new OfferingValidationModel();
    offeringValidationModel.offeringName = offering.name;
    offeringValidationModel.studyStartDate = offering.studyStartDate;
    offeringValidationModel.studyEndDate = offering.studyEndDate;
    offeringValidationModel.actualTuitionCosts = offering.actualTuitionCosts;
    offeringValidationModel.programRelatedCosts = offering.programRelatedCosts;
    offeringValidationModel.mandatoryFees = offering.mandatoryFees;
    offeringValidationModel.exceptionalExpenses = offering.exceptionalExpenses;
    offeringValidationModel.offeringDelivered =
      offering.offeringDelivered as OfferingDeliveryOptions;
    offeringValidationModel.lacksStudyBreaks = offering.lacksStudyBreaks;
    offeringValidationModel.offeringType = offering.offeringType;
    offeringValidationModel.programContext = offering.educationProgram;
    offeringValidationModel.locationId = offering.institutionLocation.id;
    offeringValidationModel.offeringIntensity = offering.offeringIntensity;
    offeringValidationModel.yearOfStudy = offering.yearOfStudy;
    offeringValidationModel.hasOfferingWILComponent =
      offering.hasOfferingWILComponent as WILComponentOptions;
    offeringValidationModel.offeringWILComponentType = offering.offeringWILType;
    offeringValidationModel.offeringDeclaration = offering.offeringDeclaration;
    offeringValidationModel.offeringType = offering.offeringType;
    offeringValidationModel.courseLoad = offering.courseLoad;
    offeringValidationModel.studyBreaks = offering.studyBreaks?.studyBreaks;
    return offeringValidationModel;
  }

  /**
   * Gets an offering with all the expected data to a complete
   * validation be performed.
   * @param offeringId offering to have the data selected.
   * @returns offering with data to be validated.
   */
  async getOfferingForValidation(
    offeringId: number,
  ): Promise<EducationProgramOffering> {
    return this.repo.findOne({
      select: {
        id: true,
        name: true,
        studyStartDate: true,
        studyEndDate: true,
        actualTuitionCosts: true,
        programRelatedCosts: true,
        mandatoryFees: true,
        exceptionalExpenses: true,
        offeringDelivered: true,
        lacksStudyBreaks: true,
        offeringType: true,
        educationProgram: {
          id: true,
          programIntensity: true,
          hasWILComponent: true,
          deliveredOnSite: true,
          deliveredOnline: true,
        },
        institutionLocation: {
          id: true,
        },
        offeringIntensity: true,
        yearOfStudy: true,
        hasOfferingWILComponent: true,
        offeringWILType: true,
        offeringDeclaration: true,
        courseLoad: true,
        // TODO: change studyBreaks to the unknown type.
        studyBreaks: {
          studyBreaks: true,
        },
      },
      relations: {
        institutionLocation: true,
        educationProgram: true,
      },
      where: {
        id: offeringId,
      },
    });
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
   * @param locationId location id.
   * @returns offering location id.
   */
  async getOfferingLocationId(
    offeringId: number,
    locationId: number,
  ): Promise<EducationProgramOffering> {
    return this.repo
      .createQueryBuilder("offerings")
      .select([
        "offerings.id",
        "location.id",
        "program.id",
        "program.isActive",
        "program.effectiveEndDate",
        "offerings.studyStartDate",
        "offerings.studyEndDate",
        "offerings.offeringIntensity",
      ])
      .innerJoin("offerings.institutionLocation", "location")
      .innerJoin("offerings.educationProgram", "program")
      .where("offerings.id = :offeringId", { offeringId })
      .andWhere("location.id = :locationId", { locationId })
      .getOne();
  }

  /**
   * Get offering details by offering id.
   * @param offeringId offering id.
   * @param programId program id.
   * @param options options for the query:
   * - `locationId`: location for authorization.
   * @returns offering object.
   */
  async getOfferingById(
    offeringId: number,
    options?: {
      locationId?: number;
      programId?: number;
    },
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
        "offering.hasOfferingWILComponent",
        "offering.offeringWILType",
        "offering.studyBreaks",
        "offering.offeringDeclaration",
        "offering.offeringType",
        "offering.assessedDate",
        "offering.submittedDate",
        "offering.courseLoad",
        "offering.offeringStatus",
        "precedingOffering.id",
        "assessedBy.firstName",
        "assessedBy.lastName",
        "institutionLocation.name",
        "institution.id",
        "institution.legalOperatingName",
        "institution.operatingName",
        "educationProgram.id",
        "educationProgram.name",
        "educationProgram.description",
        "educationProgram.credentialType",
        "educationProgram.deliveredOnline",
        "educationProgram.deliveredOnSite",
        "parentOffering.id",
      ])
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .innerJoin("institutionLocation.institution", "institution")
      .leftJoin("offering.assessedBy", "assessedBy")
      .leftJoin("offering.precedingOffering", "precedingOffering")
      .innerJoin("offering.parentOffering", "parentOffering")
      .where("offering.id = :offeringId", {
        offeringId,
      });
    if (options?.programId) {
      offeringQuery.andWhere("educationProgram.id = :programId", {
        programId: options.programId,
      });
    }
    if (options?.locationId) {
      offeringQuery.andWhere("institutionLocation.id = :locationId", {
        locationId: options.locationId,
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
      // Create the note for assessment.
      const auditUser = {
        id: userId,
      } as User;
      const now = new Date();
      const note = new Note();
      note.description = assessmentNotes;
      note.noteType = NoteType.Program;
      note.creator = auditUser;
      note.createdAt = now;
      const noteEntity = await transactionalEntityManager
        .getRepository(Note)
        .save(note);

      // update offering.
      const offering = new EducationProgramOffering();
      offering.id = offeringId;
      offering.offeringStatus = offeringStatus;
      offering.assessedDate = now;
      offering.assessedBy = auditUser;
      offering.modifier = auditUser;
      offering.updatedAt = now;
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
    educationProgramOffering: OfferingValidationModel,
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
    if (!currentOffering.educationProgram.isActive) {
      throw new CustomNamedError(
        "Program is not active to request a change for the offering.",
        OFFERING_NOT_VALID,
      );
    }
    if (!currentOffering.educationProgram.isExpired) {
      throw new CustomNamedError(
        "Program is expired to request a change for the offering.",
        OFFERING_NOT_VALID,
      );
    }

    const requestedOffering = this.populateProgramOffering(
      educationProgramOffering,
    );
    const auditUser = { id: userId } as User;
    const now = new Date();
    const precedingOffering = {
      id: currentOffering.id,
    } as EducationProgramOffering;
    //Populating the status, parent offering and audit fields.
    requestedOffering.offeringStatus = OfferingStatus.ChangeAwaitingApproval;
    //The parent offering will be just the preceding offering if
    //the change is requested only once.
    //Otherwise parent offering will be the very first offering where change was requested.
    requestedOffering.parentOffering =
      currentOffering.parentOffering ?? precedingOffering;
    requestedOffering.precedingOffering = precedingOffering;
    requestedOffering.creator = auditUser;
    requestedOffering.createdAt = now;

    //Update the status and audit details of current offering.
    const underReviewOffering = new EducationProgramOffering();
    underReviewOffering.id = offeringId;
    underReviewOffering.offeringStatus = OfferingStatus.ChangeUnderReview;
    underReviewOffering.modifier = auditUser;
    underReviewOffering.updatedAt = now;

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
        "educationProgram.id",
        "educationProgram.isActive",
        "educationProgram.effectiveEndDate",
      ])
      .innerJoin("offerings.institutionLocation", "location")
      .innerJoin("offerings.educationProgram", "educationProgram")
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
        offeringStatus: OfferingStatus.ChangeAwaitingApproval,
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
            ApplicationStatus.Cancelled,
            ApplicationStatus.Overwritten,
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
  ): Promise<Application[]> {
    return this.dataSource
      .getRepository(Application)
      .createQueryBuilder("application")
      .select("application.id")
      .addSelect("application.applicationStatus")
      .addSelect("assessment.id")
      .addSelect("studentAppeal.id")
      .innerJoin("application.currentAssessment", "assessment")
      .leftJoin("assessment.studentAppeal", "studentAppeal")
      .innerJoin(
        EducationProgramOffering,
        "offering",
        "offering.precedingOffering.id = assessment.offering.id",
      )
      .where(
        "application.applicationStatus NOT IN (:...invalidOfferingChangeStatus)",
        {
          invalidOfferingChangeStatus: [
            ApplicationStatus.Cancelled,
            ApplicationStatus.Overwritten,
          ],
        },
      )
      .andWhere("offering.id = :offeringId", { offeringId })
      .getMany();
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
      OfferingStatus.ChangeAwaitingApproval,
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
    let applications: Application[] = [];

    // Populate the status accordingly and get impacted applications
    // when the offering change is approved.
    if (offeringStatus === OfferingStatus.Approved) {
      requestedOffering.offeringStatus = OfferingStatus.Approved;
      precedingOffering.offeringStatus = OfferingStatus.ChangeOverwritten;
      applications = await this.getApplicationsToSubmitReassessment(offeringId);

      for (const application of applications) {
        if (application.applicationStatus === ApplicationStatus.Completed) {
          application.currentAssessment = {
            application: { id: application.id } as Application,
            triggerType: AssessmentTriggerType.OfferingChange,
            offering: { id: offeringId } as EducationProgramOffering,
            creator: auditUser,
            createdAt: currentDate,
            submittedBy: auditUser,
            submittedDate: currentDate,
            studentAppeal: application.currentAssessment.studentAppeal,
          } as StudentAssessment;
        }

        // If the application which is affected by offering change is not completed
        // then set the application as cancelled as it cannot be re-assessed.
        else {
          application.applicationStatus = ApplicationStatus.Cancelled;

          // Updates the current assessment status to cancellation required.
          application.currentAssessment.studentAssessmentStatus =
            StudentAssessmentStatus.CancellationRequested;
          application.currentAssessment.modifier = auditUser;
          application.currentAssessment.studentAssessmentStatusUpdatedOn =
            currentDate;
          application.currentAssessment.updatedAt = currentDate;
        }

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
      note.createdAt = currentDate;
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

      // Save applications with new current assessment or set application status as cancelled on approval.
      if (applications?.length > 0) {
        await transactionalEntityManager
          .getRepository(Application)
          .save(applications);
      }
    });
  }

  /**
   * Get changed offering for an application Id.
   * @param applicationId Application id
   * @param studentId student id.
   * @returns Offering and program details.
   */
  async getOfferingRequestsByApplicationId(
    applicationId: number,
    studentId?: number,
  ): Promise<EducationProgramOffering> {
    const offeringRequest = this.repo
      .createQueryBuilder("offering")
      .select([
        "offering.id",
        "offering.submittedDate",
        "offering.offeringStatus",
        "educationProgram.id",
      ])
      .innerJoin("offering.precedingOffering", "precedingOffering")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin(
        StudentAssessment,
        "studentAssessment",
        "studentAssessment.offering.id = precedingOffering.id",
      )
      .innerJoin("studentAssessment.application", "application")
      .where("application.id = :applicationId", { applicationId })
      .andWhere("precedingOffering.offeringStatus = :offeringStatus", {
        offeringStatus: OfferingStatus.ChangeUnderReview,
      });

    if (studentId) {
      offeringRequest
        .innerJoin("application.student", "student")
        .andWhere("student.id = :studentId", { studentId });
    }
    return offeringRequest.getOne();
  }

  /**
   * Calculate and assign study breaks.
   * @param calculatedBreaks newly calculated breaks.
   * @returns adjusted study break as per the calculatedBreaks.
   */
  static assignStudyBreaks(
    calculatedBreaks: CalculatedStudyBreaksAndWeeks,
  ): StudyBreaksAndWeeks {
    // Ensures that no additional properties will be assigned to studyBreaks
    // since calculatedStudyBreaks could received extra properties that are
    // not required to be saved to the database.
    return {
      fundedStudyPeriodDays: calculatedBreaks.fundedStudyPeriodDays,
      totalDays: calculatedBreaks.totalDays,
      totalFundedWeeks: calculatedBreaks.totalFundedWeeks,
      unfundedStudyPeriodDays: calculatedBreaks.unfundedStudyPeriodDays,
      studyBreaks: calculatedBreaks.studyBreaks?.map((studyBreak) => ({
        breakStartDate: studyBreak.breakStartDate,
        breakEndDate: studyBreak.breakEndDate,
        breakDays: studyBreak.breakDays,
        eligibleBreakDays: studyBreak.eligibleBreakDays,
        ineligibleBreakDays: studyBreak.ineligibleBreakDays,
      })),
    };
  }

  /**
   * Study break calculations needed for validations and definitions
   * like the total weeks of study for an offering.
   * @param offering offering to have the calculation executed.
   * @returns calculated offering information.
   */
  static getCalculatedStudyBreaksAndWeeks(
    offering: OfferingStudyBreakCalculationContext,
  ): CalculatedStudyBreaksAndWeeks {
    let sumOfTotalEligibleBreakDays = 0;
    let sumOfTotalIneligibleBreakDays = 0;
    const studyBreaks = offering.studyBreaks
      ?.filter(
        (eachBreak) => !!eachBreak.breakStartDate && !!eachBreak.breakEndDate,
      )
      .map((eachBreak) => {
        const newStudyBreak = {} as StudyBreak;
        newStudyBreak.breakDays = dateDifference(
          eachBreak.breakEndDate,
          eachBreak.breakStartDate,
        );
        newStudyBreak.breakStartDate = eachBreak.breakStartDate;
        newStudyBreak.breakEndDate = eachBreak.breakEndDate;
        newStudyBreak.eligibleBreakDays = Math.min(
          newStudyBreak.breakDays,
          OFFERING_STUDY_BREAK_MAX_DAYS,
        );
        newStudyBreak.ineligibleBreakDays =
          newStudyBreak.breakDays - newStudyBreak.eligibleBreakDays;
        sumOfTotalEligibleBreakDays += newStudyBreak.eligibleBreakDays;
        sumOfTotalIneligibleBreakDays += newStudyBreak.ineligibleBreakDays;

        return newStudyBreak;
      });

    // Offering total days.
    const totalDays = dateDifference(
      offering.studyEndDate,
      offering.studyStartDate,
    );

    // Allowable amount of break days allowed.
    const allowableStudyBreaksDaysAmount =
      totalDays *
      OFFERING_VALIDATIONS_STUDY_BREAK_COMBINED_PERCENTAGE_THRESHOLD;

    // Calculating the ineligible days.
    const ineligibleDaysForFundingAfterPercentageCalculation = Math.max(
      sumOfTotalEligibleBreakDays - allowableStudyBreaksDaysAmount,
      0,
    );

    const unfundedStudyPeriodDays =
      sumOfTotalIneligibleBreakDays +
      ineligibleDaysForFundingAfterPercentageCalculation;

    const fundedStudyPeriodDays = Math.max(
      totalDays - unfundedStudyPeriodDays,
      0,
    );

    const studyBreaksAndWeeks: CalculatedStudyBreaksAndWeeks = {
      studyBreaks,
      fundedStudyPeriodDays: decimalRound(fundedStudyPeriodDays),
      totalDays,
      totalFundedWeeks: Math.ceil(fundedStudyPeriodDays / 7),
      unfundedStudyPeriodDays: decimalRound(unfundedStudyPeriodDays),
      sumOfTotalEligibleBreakDays,
      sumOfTotalIneligibleBreakDays,
      allowableStudyBreaksDaysAmount,
    };

    return studyBreaksAndWeeks;
  }

  /**
   * Adjust the study breaks when there is a change in study end date
   * during scholastic standing.
   * * This method is used when there is a change in study end date, which,
   * * will affect the study break period, which will not respect the basic
   * * offering validations like min study break period etc.
   * @param studyBreaks current offering study break.
   * @param newStudyEndDate newly changed/updated study end date.
   * @returns adjusted study breaks.
   */
  static adjustStudyBreaks(
    studyBreaks: StudyBreak[],
    newStudyEndDate: string,
  ): StudyBreak[] {
    return studyBreaks
      .map((studyBreak) => {
        if (isBeforeDate(newStudyEndDate, studyBreak.breakStartDate)) {
          // Ignore the study break.
          return;
        }
        if (
          isBetweenPeriod(newStudyEndDate, {
            startDate: studyBreak.breakStartDate,
            endDate: studyBreak.breakEndDate,
          })
        ) {
          // Adjust the study break.
          const breakDays = dateDifference(
            newStudyEndDate,
            studyBreak.breakStartDate,
          );
          const eligibleBreakDays = Math.min(
            breakDays,
            OFFERING_STUDY_BREAK_MAX_DAYS,
          );
          return {
            breakStartDate: studyBreak.breakStartDate,
            breakEndDate: newStudyEndDate,
            breakDays: breakDays,
            eligibleBreakDays: eligibleBreakDays,
            ineligibleBreakDays: breakDays - eligibleBreakDays,
          };
        }
        // Consider the study break as it is.
        return studyBreak;
      })
      .filter((studyBreak) => !!studyBreak);
  }

  @InjectLogger()
  logger: LoggerService;
}
