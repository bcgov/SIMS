import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  EducationProgramService,
  InstitutionUserAuthorizations,
  EducationProgramSaveService,
} from "../../services";
import { EducationProgramAPIOutDTO } from "./models/education-program.dto";
import { credentialTypeToDisplay, getUserFullName } from "../../utilities";
import { CustomNamedError, getISODateOnlyString } from "@sims/utilities";
import {
  EDUCATION_PROGRAM_NOT_FOUND,
  EDUCATION_PROGRAM_INVALID_OPERATION,
} from "../../constants";
import { InstitutionService } from "../../services/institution/institution.service";
import { InstitutionUserTypes } from "../../auth";
import { OptionItemAPIOutDTO } from "../models/common.dto";

@Injectable()
export class EducationProgramControllerService {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly educationProgramSaveService: EducationProgramSaveService,
    private readonly institutionService: InstitutionService,
  ) {}

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
    const program = await this.programService.getEducationProgramDetails(
      programId,
      institutionId,
    );
    if (!program) {
      throw new NotFoundException("Not able to find the requested program.");
    }
    if (!program.programConfiguration?.id) {
      throw new Error("Program configuration not found.");
    }
    const programConfiguration =
      await this.educationProgramSaveService.getEducationProgramConfiguration(
        program.institution.id,
        {
          programConfigurationId: program.programConfiguration.id,
          programId: program.id,
        },
      );
    return {
      id: program.id,
      configurationId: programConfiguration.configurationId,
      programData: {
        ...program.programData,
        context: programConfiguration.context,
      },
      visualSchema: programConfiguration.visualSchema,
      validationSchema: programConfiguration.validationSchema,
      institutionId: program.institution.id,
      institutionName: program.institution.operatingName,
      submittedDate: program.submittedDate,
      submittedBy: getUserFullName(program.submittedBy),
      effectiveEndDate: getISODateOnlyString(program.effectiveEndDate),
      assessedDate: program.assessedDate,
      assessedBy: getUserFullName(program.assessedBy),
      // Program attributes persisted in dedicated columns, independent
      // of the dynamic program data shape defined by the configuration.
      // Kept for backward compatibility.
      name: program.name,
      description: program.description,
      programStatus: program.programStatus,
      credentialType: program.credentialType,
      credentialTypeToDisplay: credentialTypeToDisplay(program.credentialType),
      cipCode: program.cipCode,
      nocCode: program.nocCode,
      sabcCode: program.sabcCode,
      institutionProgramCode: program.institutionProgramCode,
      programIntensity: program.programIntensity,
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
}
