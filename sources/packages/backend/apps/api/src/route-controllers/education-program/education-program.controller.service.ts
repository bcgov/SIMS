import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  EducationProgramOfferingService,
  EducationProgramService,
  InstitutionUserAuthorizations,
} from "../../services";
import {
  AviationProgramCredentialTypes,
  EducationProgram,
  SystemLookupCategory,
} from "@sims/sims-db";
import {
  EducationProgramAPIOutDTO,
  EducationProgramAPIInDTO,
} from "./models/education-program.dto";
import { credentialTypeToDisplay, getUserFullName } from "../../utilities";
import { CustomNamedError, getISODateOnlyString } from "@sims/utilities";
import {
  EDUCATION_PROGRAM_NOT_FOUND,
  DUPLICATE_SABC_CODE,
  EDUCATION_PROGRAM_INVALID_OPERATION,
} from "../../constants";
import { ApiProcessError } from "../../types";
import {
  EntranceRequirements,
  ProgramDeliveryTypes,
  ProgramDeliveryTypeValues,
  SaveEducationProgram,
} from "../../services/education-program/education-program.service.models";
import { InstitutionService } from "../../services/institution/institution.service";
import { InstitutionUserTypes } from "../../auth";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { PROGRAM_ENTRANCE_REQUIREMENT_NONE } from "../../services/education-program/constants";
import { SystemLookupConfigurationService } from "@sims/services/system-lookup-configuration";

@Injectable()
export class EducationProgramControllerService {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
    private readonly institutionService: InstitutionService,
    private readonly systemLookupConfigurationService: SystemLookupConfigurationService,
  ) {}

  /**
   * Saves an education program (insert/update).
   * @param payload payload with data to be persisted.
   * @param institutionId institution to have the program inserted or updated.
   * @param programId if provided, will update the record, otherwise will insert a new one.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns inserted/updated program.
   */
  async saveProgram(
    payload: EducationProgramAPIInDTO,
    institutionId: number,
    auditUserId: number,
    programId?: number,
  ): Promise<EducationProgram> {
    await this.validateSaveProgramData(institutionId, payload);
    const saveProgramData = this.buildSaveProgramData(payload);

    try {
      // The payload returned from form.io contains the approvalStatus as
      // a calculated server value. If the approvalStatus value is sent
      // from the client form it will be overridden by the server calculated one.
      return await this.programService.saveEducationProgram(
        institutionId,
        auditUserId,
        saveProgramData,
        programId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case EDUCATION_PROGRAM_NOT_FOUND:
            throw new NotFoundException(error.message);
          case EDUCATION_PROGRAM_INVALID_OPERATION:
            throw new UnprocessableEntityException(error.message);
          case DUPLICATE_SABC_CODE:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }

  /**
   * Education program information shared between the Ministry and the Institution.
   * @param programId program id.
   * @param institutionId when provided, ensures the proper authorization
   * checking if the institution has access to the program.
   * @returns programs information.
   * */
  async getEducationProgram(
    programId: number,
    institutionId?: number,
  ): Promise<EducationProgramAPIOutDTO> {
    const programPromise = this.programService.getEducationProgramDetails(
      programId,
      institutionId,
    );
    const hasOfferingsPromise =
      this.educationProgramOfferingService.hasExistingOffering(programId);
    // Wait for the program and for the offering check to be retrieved.
    const [program, hasOfferings] = await Promise.all([
      programPromise,
      hasOfferingsPromise,
    ]);

    if (!program) {
      throw new NotFoundException("Not able to find the requested program.");
    }

    return {
      id: program.id,
      programStatus: program.programStatus,
      name: program.name,
      description: program.description,
      credentialType: program.credentialType,
      credentialTypeToDisplay: credentialTypeToDisplay(program.credentialType),
      cipCode: program.cipCode,
      nocCode: program.nocCode,
      sabcCode: program.sabcCode,
      regulatoryBody: program.regulatoryBody,
      otherRegulatoryBody: program.otherRegulatoryBody,
      programDeliveryTypes: {
        deliveredOnSite: program.deliveredOnSite,
        deliveredOnline: program.deliveredOnline,
      },
      deliveredOnlineAlsoOnsite: program.deliveredOnlineAlsoOnsite,
      sameOnlineCreditsEarned: program.sameOnlineCreditsEarned,
      earnAcademicCreditsOtherInstitution:
        program.earnAcademicCreditsOtherInstitution,
      courseLoadCalculation: program.courseLoadCalculation,
      completionYears: program.completionYears,
      eslEligibility: program.eslEligibility,
      hasJointInstitution: program.hasJointInstitution,
      hasJointDesignatedInstitution: program.hasJointDesignatedInstitution,
      programIntensity: program.programIntensity,
      institutionProgramCode: program.institutionProgramCode,
      minHoursWeek: program.minHoursWeek,
      isAviationProgram: program.isAviationProgram,
      credentialTypesAviation: program.credentialTypesAviation,
      minHoursWeekAvi: program.minHoursWeekAvi,
      entranceRequirements: {
        hasMinimumAge: program.hasMinimumAge,
        minHighSchool: program.minHighSchool,
        requirementsByInstitution: program.requirementsByInstitution,
        requirementsByBCITA: program.requirementsByBCITA,
        noneOfTheAboveEntranceRequirements:
          program.noneOfTheAboveEntranceRequirements,
      },
      hasWILComponent: program.hasWILComponent,
      isWILApproved: program.isWILApproved,
      wilProgramEligibility: program.wilProgramEligibility,
      hasTravel: program.hasTravel,
      travelProgramEligibility: program.travelProgramEligibility,
      hasIntlExchange: program.hasIntlExchange,
      intlExchangeProgramEligibility: program.intlExchangeProgramEligibility,
      programDeclaration: program.programDeclaration,
      institutionId: program.institution.id,
      institutionName: program.institution.operatingName,
      submittedDate: program.submittedDate,
      submittedBy: getUserFullName(program.submittedBy),
      effectiveEndDate: getISODateOnlyString(program.effectiveEndDate),
      assessedDate: program.assessedDate,
      assessedBy: getUserFullName(program.assessedBy),
      isBCPublic: program.institution.institutionType.isBCPublic,
      isBCPrivate: program.institution.institutionType.isBCPrivate,
      hasOfferings,
      isActive: program.isActive,
      isExpired: program.isExpired,
    };
  }

  /**
   * Allows a program to be deactivated by an Institution.
   * @param programId program to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param options method options.
   * - `institutionId` institution used for authorization.
   */
  async deactivateProgram(
    programId: number,
    auditUserId: number,
    options: {
      institutionId: number;
    },
  ): Promise<void>;
  /**
   * Allows a program to be deactivated by the Ministry providing additional notes.
   * @param programId program to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param options method options.
   * - `notes` notes associated with the change.
   */
  async deactivateProgram(
    programId: number,
    auditUserId: number,
    options: {
      notes: string;
    },
  ): Promise<void>;
  /**
   * Allows a program to be deactivated.
   * @param programId program to be updated.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param options method options.
   * - `institutionId` institution used for authorization.
   * - `notes` notes associated with the change.
   */
  async deactivateProgram(
    programId: number,
    auditUserId: number,
    options?: {
      institutionId?: number;
      notes?: string;
    },
  ): Promise<void> {
    try {
      await this.programService.updateEducationProgramIsActive(
        programId,
        auditUserId,
        false,
        options,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        if (error.name === EDUCATION_PROGRAM_NOT_FOUND) {
          throw new NotFoundException(error.message);
        }
        if (error.name === EDUCATION_PROGRAM_INVALID_OPERATION) {
          throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Checks if the user is authorized to create or modify programs for the institution.
   * User should have a user type different from read-only user.
   * @param userToken user token.
   * @throws ForbiddenException if the user is not authorized.
   */
  checkInstitutionAuthorization(
    institutionUserAuthorizations: InstitutionUserAuthorizations,
  ): void {
    const isAuthorized = institutionUserAuthorizations.hasUserTypeAtAnyLocation(
      InstitutionUserTypes.user,
    );
    if (!isAuthorized) {
      throw new ForbiddenException(
        "You are not authorized to create or modify a program.",
      );
    }
  }

  /**
   * Get programs for a particular institution.
   * @param institutionId ID of the institution.
   * @param options Method options:
   * - `isIncludeInActiveProgram`: If isIncludeInActiveProgram, then both active
   * and not active education program is considered.
   * @returns Programs under the specified institution.
   */
  async getProgramsListForInstitutions(
    institutionId: number,
    options?: { isIncludeInActiveProgram?: boolean },
  ): Promise<OptionItemAPIOutDTO[]> {
    const institutionExists =
      await this.institutionService.institutionExists(institutionId);
    if (!institutionExists) {
      throw new NotFoundException(`Institution ID ${institutionId} not found.`);
    }
    const programs = await this.programService.getPrograms(
      institutionId,
      options,
    );
    return programs.map((program) => ({
      id: program.id,
      description: program.name,
    }));
  }

  /**
   * Validate the program data before persisting it.
   * @param institutionId ID of the institution.
   * @param programData Program data to be validated.
   */
  private async validateSaveProgramData(
    institutionId: number,
    programData: EducationProgramAPIInDTO,
  ): Promise<void> {
    const { institutionType } =
      await this.institutionService.getInstitutionTypeById(institutionId);
    // Validate institution types.
    if (
      programData.isBCPublic !== institutionType.isBCPublic ||
      programData.isBCPrivate !== institutionType.isBCPrivate
    ) {
      throw new UnprocessableEntityException(
        "The provided BC Public and BC Private status does not match the actual institution type status.",
      );
    }
    // Validate entrance requirements.
    if (
      programData.entranceRequirements.includes(
        PROGRAM_ENTRANCE_REQUIREMENT_NONE,
      ) &&
      programData.entranceRequirements.length > 1
    ) {
      throw new BadRequestException(
        "None of the above entrance requirement cannot be provided along with other entrance requirements.",
      );
    }
    this.validateLookupValues(programData);
  }

  /**
   * Validate the lookup values in the program data.
   * @param programData Program data containing lookup values to be validated.
   */
  private validateLookupValues(programData: EducationProgramAPIInDTO): void {
    const invalidSystemLookupMessages = [];
    const isInvalidProgramLength =
      !this.systemLookupConfigurationService.isValidSystemLookup(
        SystemLookupCategory.ProgramLength,
        programData.completionYears,
      );
    const invalidEntranceRequirementLookups =
      programData.entranceRequirements.filter(
        (requirement) =>
          !this.systemLookupConfigurationService.isValidSystemLookup(
            SystemLookupCategory.ProgramEntranceRequirement,
            requirement,
          ),
      );
    const isInvalidRegulatoryBody =
      !this.systemLookupConfigurationService.isValidSystemLookup(
        SystemLookupCategory.InstitutionRegulatoryBody,
        programData.regulatoryBody,
      );

    const invalidAviationCredentials = programData.credentialTypesAviation
      ? programData.credentialTypesAviation.filter(
          (credential) =>
            !this.systemLookupConfigurationService.isValidSystemLookup(
              SystemLookupCategory.ProgramAviationCredential,
              credential,
            ),
        )
      : [];
    if (isInvalidProgramLength) {
      invalidSystemLookupMessages.push(
        `Program length ${programData.completionYears}`,
      );
    }
    if (invalidEntranceRequirementLookups.length) {
      invalidSystemLookupMessages.push(
        `Entrance requirements ${invalidEntranceRequirementLookups.join(" ")}`,
      );
    }
    if (isInvalidRegulatoryBody) {
      invalidSystemLookupMessages.push(
        `Regulatory body ${programData.regulatoryBody}`,
      );
    }
    if (invalidAviationCredentials.length) {
      invalidSystemLookupMessages.push(
        `Aviation credentials ${invalidAviationCredentials.join(" ")}`,
      );
    }
    if (invalidSystemLookupMessages.length) {
      throw new BadRequestException(
        `Invalid values for the following lookup fields: ${invalidSystemLookupMessages.join(", ")}.`,
      );
    }
  }

  /**
   * Builds the data structure required to save an education program.
   * @param programData The education program data received from the API.
   * @returns The transformed education program data to save.
   */
  private buildSaveProgramData(
    programData: EducationProgramAPIInDTO,
  ): SaveEducationProgram {
    const programDeliveryTypes: ProgramDeliveryTypes = {
      deliveredOnSite: programData.programDeliveryTypes.includes(
        ProgramDeliveryTypeValues.Onsite,
      ),
      deliveredOnline: programData.programDeliveryTypes.includes(
        ProgramDeliveryTypeValues.Online,
      ),
    };
    const entranceRequirements: EntranceRequirements = {
      hasMinimumAge: programData.entranceRequirements.includes("hasMinimumAge"),
      minHighSchool: programData.entranceRequirements.includes("minHighSchool"),
      requirementsByInstitution: programData.entranceRequirements.includes(
        "requirementsByInstitution",
      ),
      requirementsByBCITA: programData.entranceRequirements.includes(
        "requirementsByBCITA",
      ),
      noneOfTheAboveEntranceRequirements:
        programData.entranceRequirements.includes(
          PROGRAM_ENTRANCE_REQUIREMENT_NONE,
        ),
    };
    const credentialTypesAviation: AviationProgramCredentialTypes =
      programData.credentialTypesAviation
        ? {
            commercialPilotTraining:
              programData.credentialTypesAviation.includes(
                "commercialPilotTraining",
              ),
            endorsements:
              programData.credentialTypesAviation.includes("endorsements"),
            instructorsRating:
              programData.credentialTypesAviation.includes("instructorsRating"),
            privatePilotTraining: programData.credentialTypesAviation.includes(
              "privatePilotTraining",
            ),
          }
        : undefined;
    return {
      ...programData,
      programDeliveryTypes,
      entranceRequirements,
      credentialTypesAviation,
    };
  }
}
