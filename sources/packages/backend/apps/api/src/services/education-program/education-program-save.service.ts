import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  AviationCredentialTypeOptions,
  EducationProgramOfferingService,
  EducationProgramService,
  UserService,
} from "../../services";
import { EducationProgramEvaluationService } from "./education-program-evaluator";
import {
  AviationProgramCredentialTypes,
  EducationProgram,
  EducationProgramConfiguration,
  Institution,
  InstitutionType,
  ProgramStatus,
  User,
} from "@sims/sims-db";
import {
  DUPLICATE_SABC_CODE,
  EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND,
  EDUCATION_PROGRAM_DATA_INVALID,
  EDUCATION_PROGRAM_INVALID_OPERATION,
  EDUCATION_PROGRAM_NOT_FOUND,
} from "../../constants";
import { ApiProcessError } from "../../types";
import { InstitutionService } from "../../services/institution/institution.service";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import {
  EducationProgramContext,
  EducationProgramData,
  EducationProgramDynamicConfiguration,
  EducationProgramDynamicData,
} from "./education-program-save.models";
import { EducationProgramDataValidationService } from "./education-program-data-validation.service";
import {
  EducationProgramDataValidationContext,
  EducationProgramDataValidationSuccess,
  ProgramFlagEffect,
  SABC_CODE_UNIQUE_KEYWORD,
} from "./education-program-data-validation.models";
import {
  EntranceRequirements,
  EntranceRequirementValues,
  ProgramCalculatedDataKey,
  ProgramDeliveryTypes,
  ProgramDeliveryTypeValues,
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
    @InjectRepository(EducationProgram)
    private readonly educationProgramRepo: Repository<EducationProgram>,
    @InjectRepository(EducationProgramConfiguration)
    private readonly educationProgramConfigurationRepo: Repository<EducationProgramConfiguration>,
    private readonly educationProgramService: EducationProgramService,
    private readonly institutionService: InstitutionService,
    private readonly educationProgramEvaluationService: EducationProgramEvaluationService,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
    private readonly educationProgramDataValidationService: EducationProgramDataValidationService,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly userService: UserService,
  ) {}

  /**
   * Get the program configuration including context, visual schema, and validation schema.
   * @param institutionId ID of the institution requesting the configuration.
   * @param options method options.
   * - `programConfigurationId` ID of the program configuration. If not provided,
   * the most recent active configuration is returned.
   * @returns the program configuration including context, visual schema, and validation schema.
   */
  async getEducationProgramConfiguration(
    institutionId: number,
    options?: { programConfigurationId?: number },
  ): Promise<EducationProgramDynamicConfiguration> {
    const institution =
      await this.institutionService.getInstitutionTypeById(institutionId);
    const programConfiguration =
      await this.educationProgramConfigurationRepo.findOne({
        select: {
          id: true,
          visualSchema: true,
          validationSchema: true,
          updatedAt: true,
          programYear: {
            id: true,
            startDate: true,
          },
        },
        relations: {
          programYear: true,
        },
        where: { id: options?.programConfigurationId, isActive: true },
        order: {
          programYear: { startDate: "DESC" },
        },
      });
    if (!programConfiguration) {
      throw new CustomNamedError(
        "Education program configuration not found.",
        "EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND",
      );
    }
    return this.createProgramContext(
      institution.institutionType,
      programConfiguration,
      {
        hasOfferings: false,
        isActive: true,
      },
    );
  }

  async getEducationProgramConfigurationFromProgram(
    programId: number,
  ): Promise<EducationProgramDynamicConfiguration> {
    const hasOfferingsPromise =
      this.educationProgramOfferingService.hasExistingOffering(programId);
    const programPromise = this.educationProgramRepo.findOne({
      select: {
        id: true,
        isActive: true,
        effectiveEndDate: true,
        programConfiguration: {
          id: true,
          visualSchema: true,
          validationSchema: true,
          updatedAt: true,
          programYear: {
            id: true,
          },
        },
        institution: {
          id: true,
          institutionType: { id: true },
        },
      },
      relations: {
        programConfiguration: { programYear: true },
        institution: { institutionType: true },
      },
      where: { id: programId },
    });
    const [program, hasOfferings] = await Promise.all([
      programPromise,
      hasOfferingsPromise,
    ]);
    if (!program) {
      throw new NotFoundException("Not able to find the requested program.");
    }
    const institutionType = program.institution.institutionType;
    const programConfiguration = program.programConfiguration;
    return this.createProgramContext(institutionType, programConfiguration, {
      hasOfferings,
      isActive: program.isActive && !program.isExpired,
    });
  }

  private createProgramContext(
    institutionType: InstitutionType,
    programConfiguration: EducationProgramConfiguration,
    options: { hasOfferings: boolean; isActive: boolean },
  ): EducationProgramDynamicConfiguration {
    return {
      configurationId: programConfiguration.id,
      programYearId: programConfiguration.programYear.id,
      updatedAt: programConfiguration.updatedAt,
      context: {
        hasOfferings: options.hasOfferings,
        isActive: options.isActive,
        isBCPublic: institutionType.isBCPublic,
        isBCPrivate: institutionType.isBCPrivate,
        isBCInstitution:
          institutionType.isBCPrivate || institutionType.isBCPublic,
      },
      visualSchema: programConfiguration.visualSchema,
      validationSchema: programConfiguration.validationSchema,
    };
  }

  async createProgram(
    programData: EducationProgramData,
    programConfigurationId: number,
    institutionId: number,
    auditUserId: number,
  ): Promise<EducationProgram> {
    const configuration = await this.getEducationProgramConfiguration(
      institutionId,
      { programConfigurationId },
    );
    if (!configuration) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "Education program configuration not found or not active.",
          EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND,
        ),
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
    return this.saveEducationProgram(
      institutionId,
      auditUserId,
      validationResult,
      configuration.context,
      {
        programConfigurationId: programConfigurationId,
      },
    );
  }

  async updateProgram(
    programId: number,
    programData: EducationProgramData,
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
    if (program.isExpired) {
      throw new CustomNamedError(
        "Education program cannot be edited when expired.",
        EDUCATION_PROGRAM_INVALID_OPERATION,
      );
    }
    const configuration =
      await this.getEducationProgramConfigurationFromProgram(program.id);
    let programDataToUpdate: EducationProgramData;
    if (configuration.context.hasOfferings) {
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
    return this.saveEducationProgram(
      institutionId,
      auditUserId,
      validationResult,
      configuration.context,
      {
        programId: programId,
        programConfigurationId: program.programConfiguration.id,
      },
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

  private async saveEducationProgram(
    institutionId: number,
    auditUserId: number,
    validationResult: EducationProgramDataValidationSuccess,
    context: EducationProgramContext,
    options?: { programId?: number; programConfigurationId?: number },
  ): Promise<EducationProgram> {
    if (!options?.programId && !options?.programConfigurationId) {
      throw new CustomNamedError(
        "Program configuration ID is required when creating a new program.",
        EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND,
      );
    }
    let program = new EducationProgram();
    if (options?.programId) {
      // Ensures that the user has access to the institution associated with the program id being updated.
      program = await this.educationProgramService.getInstitutionProgram(
        options.programId,
        institutionId,
      );
    }
    const calculatedData =
      await this.educationProgramEvaluationService.evaluate(
        institutionId,
        [ProgramCalculatedDataKey.FieldOfStudyCode],
        validationResult.programData,
      );
    const fieldOfStudyCode =
      calculatedData[ProgramCalculatedDataKey.FieldOfStudyCode];
    if (!context.hasOfferings) {
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
    program.id = options?.programId;
    program.name = validationResult.programData.programName;
    program.description = validationResult.programData.programDescription;
    program.programData = { ...validationResult.programData, fieldOfStudyCode };
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    if (!options?.programId) {
      program.institution = { id: institutionId } as Institution;
      program.programConfiguration = {
        id: options.programConfigurationId,
      } as EducationProgramConfiguration;
      program.submittedBy = auditUser;
      program.submittedDate = now;
      program.creator = auditUser;
      program.createdAt = now;
    } else {
      program.modifier = auditUser;
      program.updatedAt = now;
    }
    return this.dataSource.transaction(async (entityManager) => {
      await this.saveInstitutionAddsPendingProgramNotification(
        { name: program.name, programStatus: program.programStatus },
        institutionId,
        auditUserId,
        entityManager,
      );
      return entityManager.getRepository(EducationProgram).save(program);
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
