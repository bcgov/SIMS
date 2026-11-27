import { Injectable } from "@nestjs/common";
import {
  AviationCredentialTypeOptions,
  EducationProgramService,
  SABC_CODE_UNIQUE_KEYWORD,
  UserService,
} from "../../services";
import { EducationProgramEvaluationService } from "./education-program-evaluator";
import { EducationProgramConfigurationRetrievalService } from "./education-program-configuration-retrieval.service";
import { RequiredProgramConfiguration } from "./education-program-configuration-retrieval.models";
import {
  AviationProgramCredentialTypes,
  EducationProgram,
  EducationProgramConfiguration,
  Institution,
  ProgramStatus,
  User,
} from "@sims/sims-db";
import {
  DUPLICATE_SABC_CODE,
  EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND,
  EDUCATION_PROGRAM_CONFIGURATION_OUTDATED,
  EDUCATION_PROGRAM_DATA_INVALID,
  EDUCATION_PROGRAM_INVALID_OPERATION,
  EDUCATION_PROGRAM_NOT_FOUND,
  EDUCATION_PROGRAM_UPDATE_RESTRICTION_CHANGED,
} from "../../constants";
import { InstitutionService } from "../../services/institution/institution.service";
import { DataSource, EntityManager } from "typeorm";
import {
  EducationProgramContext,
  EducationProgramData,
  EducationProgramDynamicConfiguration,
  EducationProgramDynamicData,
  EntranceRequirementValues,
  ProgramDeliveryTypeValues,
} from "./education-program-save.models";
import { EducationProgramDataValidationService } from "./data-validation/education-program-data-validation.service";
import { EducationProgramDataValidationContext } from "./data-validation/custom-validators/custom-validators.models";
import {
  EducationProgramDataValidationSuccess,
  ProgramFlagEffect,
} from "./data-validation/education-program-data-validation.models";
import {
  EntranceRequirements,
  ProgramCalculatedDataKey,
  ProgramDeliveryTypes,
} from "./education-program.service.models";
import { CustomNamedError } from "@sims/utilities";
import { OTHER_REGULATORY_BODY } from "./constants";
import {
  NotificationActionsService,
  InstitutionAddsPendingProgramNotification,
} from "@sims/services";

@Injectable()
export class EducationProgramSaveService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly educationProgramService: EducationProgramService,
    private readonly institutionService: InstitutionService,
    private readonly educationProgramEvaluationService: EducationProgramEvaluationService,
    private readonly educationProgramDataValidationService: EducationProgramDataValidationService,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly userService: UserService,
    private readonly educationProgramConfigurationRetrievalService: EducationProgramConfigurationRetrievalService,
  ) {}

  /**
   * Create a new education program.
   * @param programYearId the ID of the program year the program is being created for.
   * @param programData the data for the new education program.
   * @param programConfigurationId the ID of the program configuration used to fill the
   * program data. It must be the active configuration for the program year.
   * @param institutionId the ID of the institution.
   * @param auditUserId the ID of the user performing the action.
   * @returns the created education program.
   */
  async createProgram(
    programYearId: number,
    programData: EducationProgramData,
    programConfigurationId: number,
    institutionId: number,
    auditUserId: number,
  ): Promise<EducationProgram> {
    // Only the active configuration for the program year can be used to create a program.
    const configuration =
      await this.educationProgramConfigurationRetrievalService.getEducationProgramConfiguration(
        institutionId,
        {
          requiredConfiguration:
            RequiredProgramConfiguration.ProgramYearActiveConfiguration,
          programYearId,
        },
      );
    if (configuration.configurationId !== programConfigurationId) {
      throw new CustomNamedError(
        "The program configuration has changed since the program data was retrieved.",
        EDUCATION_PROGRAM_CONFIGURATION_OUTDATED,
      );
    }
    const programDataToValidate = {
      ...programData,
      context: configuration.context,
    };
    const validationResult = await this.getValidatedResult(
      configuration,
      programDataToValidate,
      {
        institutionId,
        programYearId: configuration.programYearId,
      },
    );
    const program = this.createNewProgramEntity(
      institutionId,
      programConfigurationId,
      auditUserId,
    );
    return this.saveEducationProgram(
      program,
      institutionId,
      auditUserId,
      validationResult,
      configuration.context,
      { associateParentProgram: true },
    );
  }

  /**
   * Renew an existing education program into the next program year.
   * Renewals are possible only between sequential program years
   * and only for active programs.
   * @param renewFromProgramId the ID of the program to renew from. Used to enforce sequential renewal
   * and to create a relationship between the old and new programs.
   * @param updatedProgramData the updated data for the new program.
   * @param programConfigurationId the ID of the program configuration used to fill the
   * program data. It must be the active configuration for the next program year.
   * @param institutionId the ID of the institution.
   * @param auditUserId the ID of the user performing the action.
   * @returns the renewed education program.
   */
  async renewProgram(
    renewFromProgramId: number,
    updatedProgramData: EducationProgramData,
    programConfigurationId: number,
    institutionId: number,
    auditUserId: number,
  ): Promise<EducationProgram> {
    const programToRenew =
      await this.educationProgramService.getEducationProgramDetails(
        renewFromProgramId,
        institutionId,
      );
    if (!programToRenew) {
      throw new CustomNamedError(
        "Not able to find the education program to renew from.",
        EDUCATION_PROGRAM_NOT_FOUND,
      );
    }
    if (programToRenew.renewedProgram) {
      throw new CustomNamedError(
        "The education program has already been renewed.",
        EDUCATION_PROGRAM_INVALID_OPERATION,
      );
    }
    if (!programToRenew.isActive) {
      throw new CustomNamedError(
        "Education program cannot be renewed when inactive.",
        EDUCATION_PROGRAM_INVALID_OPERATION,
      );
    }
    let configuration: EducationProgramDynamicConfiguration;
    try {
      configuration =
        await this.educationProgramConfigurationRetrievalService.getEducationProgramConfiguration(
          institutionId,
          {
            requiredConfiguration:
              RequiredProgramConfiguration.NextProgramYearActiveConfiguration,
            currentProgramYearId:
              programToRenew.programConfiguration.programYear.id,
          },
        );
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND
      ) {
        throw new CustomNamedError(
          `No next program configuration found for renewal for the program ID ${renewFromProgramId}.`,
          EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND,
        );
      }
      throw error;
    }
    if (configuration.configurationId !== programConfigurationId) {
      throw new CustomNamedError(
        "The program configuration has changed since the program data was retrieved.",
        EDUCATION_PROGRAM_CONFIGURATION_OUTDATED,
      );
    }
    const programDataToValidate = {
      ...updatedProgramData,
      context: configuration.context,
    };
    const validationResult = await this.getValidatedResult(
      configuration,
      programDataToValidate,
      {
        institutionId,
        programYearId: configuration.programYearId,
      },
    );
    const program = this.createNewProgramEntity(
      institutionId,
      programConfigurationId,
      auditUserId,
    );
    if (!programToRenew.parentProgram?.id) {
      throw new Error(
        `Program ID ${renewFromProgramId} cannot be renewed because it is not associated with a parent program.`,
      );
    }
    program.parentProgram = {
      id: programToRenew.parentProgram.id,
    } as EducationProgram;
    program.precedingProgram = { id: programToRenew.id } as EducationProgram;
    return this.saveEducationProgram(
      program,
      institutionId,
      auditUserId,
      validationResult,
      configuration.context,
    );
  }

  /**
   * Update an existing and active education program.
   * @param programId the ID of the program to update.
   * @param programData the updated data for the education program.
   * @param programConfigurationId the ID of the program configuration used to fill the
   * program data. It must be the configuration expected for the update
   * ({@link RequiredProgramConfiguration.ProgramAssociatedConfigurationForUpdate}).
   * @param isFullUpdateRestricted indicates if the full update was restricted when the
   * program data was retrieved for the update. The update is rejected if the program
   * was retrieved for a full update but the full update is now restricted.
   * @param institutionId the ID of the institution.
   * @param auditUserId the ID of the user performing the action.
   * @returns the updated education program.
   */
  async updateProgram(
    programId: number,
    programData: EducationProgramData,
    programConfigurationId: number,
    isFullUpdateRestricted: boolean,
    institutionId: number,
    auditUserId: number,
  ): Promise<EducationProgram> {
    const program =
      await this.educationProgramService.getEducationProgramDetails(
        programId,
        institutionId,
      );
    if (!program) {
      throw new CustomNamedError(
        "Not able to find the education program.",
        EDUCATION_PROGRAM_NOT_FOUND,
      );
    }
    if (!program.isActive) {
      throw new CustomNamedError(
        "Education program cannot be edited when inactive.",
        EDUCATION_PROGRAM_INVALID_OPERATION,
      );
    }
    const configuration =
      await this.educationProgramConfigurationRetrievalService.getEducationProgramConfiguration(
        program.institution.id,
        {
          requiredConfiguration:
            RequiredProgramConfiguration.ProgramAssociatedConfigurationForUpdate,
          programId: program.id,
        },
      );
    // Checked before the configuration ID since a restriction change can also change
    // the expected configuration, and this check provides the more specific error.
    if (
      configuration.context.isFullUpdateRestricted &&
      !isFullUpdateRestricted
    ) {
      throw new CustomNamedError(
        "This program can no longer be fully edited.",
        EDUCATION_PROGRAM_UPDATE_RESTRICTION_CHANGED,
      );
    }
    if (configuration.configurationId !== programConfigurationId) {
      throw new CustomNamedError(
        "The program configuration has changed since the program data was retrieved.",
        EDUCATION_PROGRAM_CONFIGURATION_OUTDATED,
      );
    }
    let programDataToUpdate: EducationProgramData;
    if (configuration.context.isFullUpdateRestricted) {
      // Only the name and description can be changed once the program has
      // offerings, so the persisted data is the one to be validated.
      programDataToUpdate = {
        ...program.programData,
        programName: programData.programName,
        programDescription: programData.programDescription,
        context: configuration.context,
      };
    } else {
      programDataToUpdate = {
        ...programData,
        context: configuration.context,
      };
    }
    const validationResult = await this.getValidatedResult(
      configuration,
      programDataToUpdate,
      {
        institutionId,
        programYearId: configuration.programYearId,
        programId: programId,
      },
    );
    const programToUpdate = new EducationProgram();
    programToUpdate.id = programId;
    // For a full update, the program is moved to the active configuration of the program year.
    // For a partial update, the configuration the program was saved with is kept.
    programToUpdate.programConfiguration = {
      id: configuration.configurationId,
    } as EducationProgramConfiguration;
    programToUpdate.modifier = { id: auditUserId } as User;
    programToUpdate.updatedAt = new Date();
    return this.saveEducationProgram(
      programToUpdate,
      institutionId,
      auditUserId,
      validationResult,
      configuration.context,
    );
  }

  /**
   * Get the successful validation result for the program data.
   * If the validation fails, a CustomNamedError is thrown with specific error codes for different failure reasons.
   * @param configuration program configuration providing the validation schema.
   * @param programData dynamic program data to be validated.
   * @param validationContext server-side information required by the backend-only validations.
   * @returns the successful validation result for the program data.
   */
  private async getValidatedResult(
    configuration: EducationProgramDynamicConfiguration,
    programData: EducationProgramData,
    validationContext: EducationProgramDataValidationContext,
  ): Promise<EducationProgramDataValidationSuccess> {
    const validationResult =
      await this.educationProgramDataValidationService.validate(
        configuration,
        programData,
        validationContext,
      );
    if (validationResult.isValid === true) {
      return validationResult;
    }
    if (validationResult.failedKeywords.includes(SABC_CODE_UNIQUE_KEYWORD)) {
      throw new CustomNamedError("Duplicate SABC code.", DUPLICATE_SABC_CODE);
    }
    throw new CustomNamedError(
      "Education program data is not valid.",
      EDUCATION_PROGRAM_DATA_INVALID,
      validationResult.errors,
    );
  }

  /**
   * Creates a new education program entity with the properties required
   * for a new program (created from scratch or renewed).
   * @param institutionId the ID of the institution.
   * @param programConfigurationId the ID of the program configuration.
   * @param auditUserId the ID of the user performing the action.
   * @returns the new education program entity.
   */
  private createNewProgramEntity(
    institutionId: number,
    programConfigurationId: number,
    auditUserId: number,
  ): EducationProgram {
    const program = new EducationProgram();
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    program.institution = { id: institutionId } as Institution;
    program.programConfiguration = {
      id: programConfigurationId,
    } as EducationProgramConfiguration;
    program.submittedBy = auditUser;
    program.submittedDate = now;
    program.creator = auditUser;
    program.createdAt = now;
    return program;
  }

  /**
   * Saves an education program, assigning the data based on the provided validation result.
   * @param program the education program entity to be saved, already populated with
   * the properties specific to the operation (create, renew, or update).
   * @param institutionId the ID of the institution.
   * @param auditUserId the ID of the user performing the action.
   * @param validationResult the result of the program data validation.
   * @param context the context of the education program.
   * @param options optional settings for the save operation.
   * - `associateParentProgram`: if true, the saved program will be associated as its own parent program.
   * Used only during the first time the program is saved.
   * @returns the created or updated education program.
   */
  private async saveEducationProgram(
    program: EducationProgram,
    institutionId: number,
    auditUserId: number,
    validationResult: EducationProgramDataValidationSuccess,
    context: EducationProgramContext,
    options?: { associateParentProgram: boolean },
  ): Promise<EducationProgram> {
    const calculatedData =
      await this.educationProgramEvaluationService.evaluate(
        institutionId,
        [ProgramCalculatedDataKey.FieldOfStudyCode],
        validationResult.programData,
      );
    const fieldOfStudyCode =
      calculatedData[ProgramCalculatedDataKey.FieldOfStudyCode];
    if (!context.isFullUpdateRestricted) {
      // When full update is not restricted, the program status and legacy data can be updated.
      program.programStatus = validationResult.flags.some(
        (flag) => flag.effect === ProgramFlagEffect.PendingReview,
      )
        ? ProgramStatus.Pending
        : ProgramStatus.Approved;
      this.assignProgramLegacyData(
        program,
        validationResult.programData as EducationProgramDynamicData,
        fieldOfStudyCode,
      );
    }
    program.name = validationResult.programData.programName;
    program.description = validationResult.programData.programDescription;
    // The persisted dynamic program saved at this point varies depending of the update type.
    // Depending on the current program context, only a partial update may happen to the dynamic program data.
    // When a partial update occurs, the dynamic data will be the current saved DB values merged with the
    // partial updated allowed by the current program context.
    // For instance, if program has offerings (isFullUpdateRestricted is true), only fields like programName
    // and programDescription may be updated.
    program.programData = { ...validationResult.programData, fieldOfStudyCode };
    return this.dataSource.transaction(async (entityManager) => {
      await this.saveInstitutionAddsPendingProgramNotification(
        { name: program.name, programStatus: program.programStatus },
        institutionId,
        auditUserId,
        entityManager,
      );
      const educationProgramRepo =
        entityManager.getRepository(EducationProgram);
      const savedProgram = await educationProgramRepo.save(program);
      if (options?.associateParentProgram) {
        // Associate the saved program as its own parent program.
        await educationProgramRepo.update(
          { id: savedProgram.id },
          { parentProgram: { id: savedProgram.id } },
        );
      }
      return savedProgram;
    });
  }

  /**
   * Use the submitted dynamic program data to assign legacy program attributes.
   * @param program education program entity to which legacy attributes will be assigned.
   * @param dynamicProgramData dynamic program data submitted by the user.
   * @param fieldOfStudyCode field of study code calculated from the dynamic program data.
   */
  private assignProgramLegacyData(
    program: EducationProgram,
    dynamicProgramData: EducationProgramDynamicData,
    fieldOfStudyCode: number,
  ): void {
    const {
      programDeliveryTypes,
      entranceRequirements,
      credentialTypesAviation,
    } = this.buildLegacyProgramData(dynamicProgramData);
    // Assign attributes for update from payload only if existing program has no offering(s).
    program.fieldOfStudyCode = fieldOfStudyCode;
    program.credentialType = dynamicProgramData.credentialType;
    program.cipCode = dynamicProgramData.cipCode;
    program.nocCode = dynamicProgramData.nocCode || null;
    // Save SABC code as null in case of not answered in the form.
    // This way it can be saved when multiple programs does not have a SABC code.
    program.sabcCode = dynamicProgramData.sabcCode?.trim() || null;
    program.regulatoryBody = dynamicProgramData.regulatoryBody;
    program.otherRegulatoryBody =
      dynamicProgramData.regulatoryBody === OTHER_REGULATORY_BODY
        ? dynamicProgramData.otherRegulatoryBody
        : null;
    program.deliveredOnSite = programDeliveryTypes.deliveredOnSite;
    program.deliveredOnline = programDeliveryTypes.deliveredOnline;
    program.deliveredOnlineAlsoOnsite =
      dynamicProgramData.deliveredOnlineAlsoOnsite || null;
    program.sameOnlineCreditsEarned =
      dynamicProgramData.sameOnlineCreditsEarned || null;
    program.earnAcademicCreditsOtherInstitution =
      dynamicProgramData.earnAcademicCreditsOtherInstitution || null;
    program.courseLoadCalculation = dynamicProgramData.courseLoadCalculation;
    program.completionYears = dynamicProgramData.completionYears;
    program.eslEligibility = dynamicProgramData.eslEligibility;
    program.hasJointInstitution = dynamicProgramData.hasJointInstitution;
    program.hasJointDesignatedInstitution =
      dynamicProgramData.hasJointDesignatedInstitution || null;
    program.programIntensity = dynamicProgramData.programIntensity;
    program.institutionProgramCode =
      dynamicProgramData.institutionProgramCode || null;
    program.minHoursWeek = dynamicProgramData.minHoursWeek || null;
    program.isAviationProgram = dynamicProgramData.isAviationProgram;
    program.credentialTypesAviation = credentialTypesAviation || null;
    program.minHoursWeekAvi = dynamicProgramData.minHoursWeekAvi || null;
    program.hasMinimumAge = entranceRequirements.hasMinimumAge;
    program.minHighSchool = entranceRequirements.minHighSchool;
    program.requirementsByInstitution =
      entranceRequirements.requirementsByInstitution;
    program.requirementsByBCITA = entranceRequirements.requirementsByBCITA;
    program.noneOfTheAboveEntranceRequirements =
      entranceRequirements.noneOfTheAboveEntranceRequirements;
    program.hasWILComponent = dynamicProgramData.hasWILComponent;
    program.isWILApproved = dynamicProgramData.isWILApproved || null;
    program.wilProgramEligibility =
      dynamicProgramData.wilProgramEligibility || null;
    program.hasTravel = dynamicProgramData.hasTravel;
    program.travelProgramEligibility =
      dynamicProgramData.travelProgramEligibility || null;
    program.hasIntlExchange = dynamicProgramData.hasIntlExchange;
    program.intlExchangeProgramEligibility =
      dynamicProgramData.intlExchangeProgramEligibility || null;
    program.programDeclaration = dynamicProgramData.programDeclaration;
  }

  /**
   * Convert non-primitive education program data into a structured format suitable for saving.
   * Used temporarily for legacy support.
   * @param programData education program data.
   * @returns transformed education program data.
   */
  private buildLegacyProgramData(programData: EducationProgramDynamicData): {
    programDeliveryTypes: ProgramDeliveryTypes;
    entranceRequirements: EntranceRequirements;
    credentialTypesAviation?: AviationProgramCredentialTypes;
  } {
    const programDeliveryTypes: ProgramDeliveryTypes = {
      deliveredOnSite: programData.programDeliveryTypes.includes(
        ProgramDeliveryTypeValues.Onsite,
      ),
      deliveredOnline: programData.programDeliveryTypes.includes(
        ProgramDeliveryTypeValues.Online,
      ),
    };
    const entranceRequirements: EntranceRequirements = {
      hasMinimumAge: programData.entranceRequirements.includes(
        EntranceRequirementValues.HasMinimumAge,
      ),
      minHighSchool: programData.entranceRequirements.includes(
        EntranceRequirementValues.MinHighSchool,
      ),
      requirementsByInstitution: programData.entranceRequirements.includes(
        EntranceRequirementValues.RequirementsByInstitution,
      ),
      requirementsByBCITA: programData.entranceRequirements.includes(
        EntranceRequirementValues.RequirementsByBCITA,
      ),
      noneOfTheAboveEntranceRequirements:
        programData.entranceRequirements.includes(
          EntranceRequirementValues.NoneOfTheAboveEntranceRequirements,
        ),
    };
    const credentialTypesAviation: AviationProgramCredentialTypes =
      programData.credentialTypesAviation
        ? {
            commercialPilotTraining:
              programData.credentialTypesAviation.includes(
                AviationCredentialTypeOptions.CommercialPilotTraining,
              ),
            endorsements: programData.credentialTypesAviation.includes(
              AviationCredentialTypeOptions.Endorsements,
            ),
            instructorsRating: programData.credentialTypesAviation.includes(
              AviationCredentialTypeOptions.InstructorsRating,
            ),
            privatePilotTraining: programData.credentialTypesAviation.includes(
              AviationCredentialTypeOptions.PrivatePilotTraining,
            ),
          }
        : undefined;
    return {
      programDeliveryTypes,
      entranceRequirements,
      credentialTypesAviation,
    };
  }

  /**
   * Saves institution adds pending program notification for the ministry.
   * @param program program
   * @param institutionId related institution id.
   * @param entityManager
   */
  private async saveInstitutionAddsPendingProgramNotification(
    program: Pick<EducationProgram, "name" | "programStatus">,
    institutionId: number,
    userId: number,
    entityManager: EntityManager,
  ): Promise<void> {
    if (program.programStatus !== ProgramStatus.Pending) {
      return;
    }
    const institution = await this.institutionService.getInstitutionDetailById(
      institutionId,
      { entityManager },
    );
    const userEmail = await this.userService.getUserEmail(userId, {
      entityManager,
    });
    const ministryNotification: InstitutionAddsPendingProgramNotification = {
      institutionName: institution.legalOperatingName,
      institutionOperatingName: institution.operatingName,
      programName: program.name,
      institutionPrimaryEmail: institution.primaryEmail,
      email: userEmail,
    };
    await this.notificationActionsService.saveInstitutionAddsPendingProgramNotification(
      ministryNotification,
      entityManager,
    );
  }
}
