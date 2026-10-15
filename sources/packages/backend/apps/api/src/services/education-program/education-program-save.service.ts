import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  EducationProgramOfferingService,
  EducationProgramService,
} from "../../services";
import { EducationProgramEvaluationService } from "./education-program-evaluator";
import {
  EducationProgram,
  EducationProgramConfiguration,
  FormYesNoOptions,
  Institution,
  ProgramStatus,
  User,
} from "@sims/sims-db";
import {
  EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND,
  EDUCATION_PROGRAM_DATA_INVALID,
  EDUCATION_PROGRAM_INVALID_OPERATION,
  EDUCATION_PROGRAM_NOT_FOUND,
} from "../../constants";
import { ApiProcessError } from "../../types";
import { InstitutionService } from "../../services/institution/institution.service";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  EducationProgramContext,
  EducationProgramData,
  EducationProgramDynamicConfiguration,
  EducationProgramDynamicData,
} from "./education-program-save.models";
import { EducationProgramDataValidationService } from "./education-program-data-validation.service";
import { ProgramCalculatedDataKey } from "./education-program.service.models";
import { CustomNamedError } from "@sims/utilities";
import { OTHER_REGULATORY_BODY } from "./constants";

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
  ) {}

  /**
   * Get the program configuration including context, visual schema, and validation schema.
   * @param programConfigurationId ID of the program configuration.
   * @param institutionId ID of the institution requesting the configuration.
   * @returns the program configuration including context, visual schema, and validation schema.
   */
  async getEducationProgramConfigurationForCreation(
    programConfigurationId: number,
    institutionId: number,
  ): Promise<EducationProgramDynamicConfiguration> {
    const institution =
      await this.institutionService.getInstitutionTypeById(institutionId);
    const programConfiguration =
      await this.educationProgramConfigurationRepo.findOneOrFail({
        select: {
          id: true,
          visualSchema: true,
          validationSchema: true,
          updatedAt: true,
        },
        where: { id: programConfigurationId, isActive: true },
      });
    return {
      configurationId: programConfiguration.id,
      updatedAt: programConfiguration.updatedAt,
      context: {
        hasOfferings: false,
        isActive: true,
        isBCPublic: institution.institutionType.isBCPublic,
        isBCPrivate: institution.institutionType.isBCPrivate,
        isBCInstitution:
          institution.institutionType.isBCPrivate ||
          institution.institutionType.isBCPublic,
      },
      visualSchema: programConfiguration.visualSchema,
      validationSchema: programConfiguration.validationSchema,
    };
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
        },
        institution: {
          id: true,
          institutionType: { id: true },
        },
      },
      relations: {
        programConfiguration: true,
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
    const institution = program.institution;
    const programConfiguration = program.programConfiguration;
    return {
      configurationId: programConfiguration.id,
      updatedAt: programConfiguration.updatedAt,
      context: {
        hasOfferings: hasOfferings,
        isActive: program.isActive && !program.isExpired,
        isBCPublic: institution.institutionType.isBCPublic,
        isBCPrivate: institution.institutionType.isBCPrivate,
        isBCInstitution:
          institution.institutionType.isBCPrivate ||
          institution.institutionType.isBCPublic,
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
    const configuration =
      await this.getEducationProgramConfigurationForCreation(
        programConfigurationId,
        institutionId,
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
    this.validateEducationProgramData(configuration, programDataToValidate);
    return this.saveEducationProgram(
      institutionId,
      auditUserId,
      programData,
      configuration.context,
      {
        programId: undefined,
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
      throw new NotFoundException("Not able to find the education program.");
    }
    const configuration =
      await this.getEducationProgramConfigurationFromProgram(
        program.programConfiguration.id,
      );
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
    this.validateEducationProgramData(configuration, programDataToUpdate);
    return this.saveEducationProgram(
      institutionId,
      auditUserId,
      programData,
      configuration.context,
      {
        programId: programId,
        programConfigurationId: program.programConfiguration.id,
      },
    );
  }

  private validateEducationProgramData(
    configuration: EducationProgramDynamicConfiguration,
    programData: EducationProgramData,
  ): void {
    const validationResult =
      this.educationProgramDataValidationService.validate(
        configuration,
        programData,
      );
    if (validationResult.isValid === false) {
      throw new CustomNamedError(
        "Education program data is not valid.",
        EDUCATION_PROGRAM_DATA_INVALID,
        validationResult.errors,
      );
    }
  }

  private async saveEducationProgram(
    institutionId: number,
    auditUserId: number,
    programData: EducationProgramData,
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
    }
    // TODO: move the validation for SABC code duplication to the validation service (AJV)?
    // if (programData.sabcCode) {
    //   const isSABCCodeDuplicate =
    //     await this.educationProgramService.hasExistingProgramWithSameSABCCode(
    //       institutionId,
    //       programData.sabcCode,
    //       options?.programId,
    //     );
    //   if (isSABCCodeDuplicate) {
    //     throw new CustomNamedError("Duplicate SABC code.", DUPLICATE_SABC_CODE);
    //   }
    // }

    // Values also saved to the existing program structure until the
    // dynamic data is the only source of the program data.
    const dynamicProgramData = programData as EducationProgramDynamicData;
    // TODO: review FieldOfStudyCode evaluator.
    const calculatedData =
      await this.educationProgramEvaluationService.evaluate(
        institutionId,
        [ProgramCalculatedDataKey.FieldOfStudyCode],
        {
          credentialType: dynamicProgramData.credentialType,
          programDeliveryTypes: {
            deliveredOnline:
              dynamicProgramData.programDeliveryTypes?.online ===
              FormYesNoOptions.Yes,
            deliveredOnSite:
              dynamicProgramData.programDeliveryTypes?.onSite ===
              FormYesNoOptions.Yes,
          },
        },
      );
    const fieldOfStudyCode =
      calculatedData[ProgramCalculatedDataKey.FieldOfStudyCode];
    if (!context.hasOfferings) {
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
      program.deliveredOnSite =
        dynamicProgramData.programDeliveryTypes?.onSite ===
        FormYesNoOptions.Yes;
      program.deliveredOnline =
        dynamicProgramData.programDeliveryTypes?.online ===
        FormYesNoOptions.Yes;
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
      // TODO: Calculate program status.
      program.programStatus = ProgramStatus.Pending;
      program.programIntensity = dynamicProgramData.programIntensity;
      program.institutionProgramCode =
        dynamicProgramData.institutionProgramCode || null;
      program.minHoursWeek = dynamicProgramData.minHoursWeek || null;
      program.isAviationProgram = dynamicProgramData.isAviationProgram;
      program.credentialTypesAviation =
        dynamicProgramData.credentialTypesAviation || null;
      program.minHoursWeekAvi = dynamicProgramData.minHoursWeekAvi || null;
      program.hasMinimumAge =
        dynamicProgramData.entranceRequirements.hasMinimumAge;
      program.minHighSchool =
        dynamicProgramData.entranceRequirements.minHighSchool;
      program.requirementsByInstitution =
        dynamicProgramData.entranceRequirements.requirementsByInstitution;
      program.requirementsByBCITA =
        dynamicProgramData.entranceRequirements.requirementsByBCITA;
      program.noneOfTheAboveEntranceRequirements =
        dynamicProgramData.entranceRequirements.noneOfTheAboveEntranceRequirements;
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
    program.id = options?.programId;
    program.name = programData.programName;
    program.description = programData.programDescription;
    program.programData = { ...programData, fieldOfStudyCode };

    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    if (!options?.programId) {
      // Institution should never be updated after creation.
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
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // TODO: send notification.
      //   await this.saveInstitutionAddsPendingProgramNotification(
      //     { name: program.name, programStatus: program.programStatus },
      //     institutionId,
      //     auditUserId,
      //     transactionalEntityManager,
      //   );
      return transactionalEntityManager
        .getRepository(EducationProgram)
        .save(program);
    });
  }
}
