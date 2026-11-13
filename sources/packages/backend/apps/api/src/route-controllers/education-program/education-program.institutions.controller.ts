import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import {
  CreateEducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
  EducationProgramConfigurationAPIOutDTO,
  EducationProgramManagerDetailsAPIOutDTO,
  EducationProgramsSummaryLocationAPIOutDTO,
  EducationProgramYearAPIOutDTO,
  ProgramEvaluationAPIInDTO,
  ProgramRenewalStatus,
  ProgramEvaluationAPIOutDTO,
  UpdateEducationProgramAPIInDTO,
} from "./models/education-program.dto";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  PaginatedResultsAPIOutDTO,
  ProgramsLocationPaginationOptionsAPIInDTO,
  ProgramsManagementPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { EducationProgramService } from "../../services/education-program/education-program.service";
import { EducationProgramControllerService } from "../../route-controllers/education-program/education-program.controller.service";
import { OfferingTypes } from "@sims/sims-db/entities/offering.type";
import { credentialTypeToDisplay, PaginatedResults } from "../../utilities";
import { CustomNamedError, isSameOrAfterDate } from "@sims/utilities";
import { EducationProgramEvaluationService } from "../../services/education-program/education-program-evaluator";
import {
  EducationProgramData,
  EducationProgramManagerService,
  EducationProgramSaveService,
  ProgramYearService,
} from "../../services";
import {
  EDUCATION_PROGRAM_INVALID_OPERATION,
  DUPLICATE_SABC_CODE,
  EDUCATION_PROGRAM_NOT_FOUND,
  EDUCATION_PROGRAM_DATA_INVALID,
  EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND,
  EDUCATION_PROGRAM_CONFIGURATION_OUTDATED,
} from "../../constants";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("education-program")
@ApiTags(`${ClientTypeBaseRoute.Institution}-education-program`)
export class EducationProgramInstitutionsController extends BaseController {
  constructor(
    private readonly educationProgramService: EducationProgramService,
    private readonly educationProgramSaveService: EducationProgramSaveService,
    private readonly educationProgramControllerService: EducationProgramControllerService,
    private readonly educationProgramEvaluationService: EducationProgramEvaluationService,
    private readonly educationProgramManagerService: EducationProgramManagerService,
    private readonly programYearService: ProgramYearService,
  ) {
    super();
  }

  /**
   * Get programs for a particular location with pagination.
   * @param locationId id of the location.
   * @param paginationOptions pagination options.
   * @returns paginated programs summary.
   */
  @HasLocationAccess("locationId")
  @Get("location/:locationId/summary")
  async getProgramsSummaryByLocationId(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Query() paginationOptions: ProgramsLocationPaginationOptionsAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<
    PaginatedResultsAPIOutDTO<EducationProgramsSummaryLocationAPIOutDTO>
  > {
    const programsSummary =
      await this.educationProgramService.getProgramsSummaryForLocation(
        userToken.authorizations.institutionId,
        [OfferingTypes.Public, OfferingTypes.Private],
        paginationOptions,
        locationId,
      );

    return {
      results: programsSummary.results.map((program) => ({
        programId: program.programId,
        programName: program.programName,
        sabcCode: program.sabcCode,
        cipCode: program.cipCode,
        credentialType: program.credentialType,
        programStatus: program.programStatus,
        isActive: program.isActive,
        isExpired: isSameOrAfterDate(program.effectiveEndDate, new Date()),
        totalOfferings: program.totalOfferings,
        locationId: program.locationId,
        locationName: program.locationName,
        credentialTypeToDisplay: credentialTypeToDisplay(
          program.credentialType,
        ),
      })),
      count: programsSummary.count,
    };
  }

  /**
   * Get the program configuration for creation, including context, visual schema,
   * and validation schema, using the active configuration for the provided program year.
   * Paired with the creation endpoint ({@link createEducationProgram}).
   * @param programYearId ID of the program year.
   * @param userToken the token of the user making the request.
   * @returns the program configuration including context, visual schema, and validation schema.
   */
  @ApiNotFoundResponse({
    description:
      "The provided program year does not have an active program configuration.",
  })
  @Get("program-year/:programYearId/create")
  async getEducationProgramForCreate(
    @Param("programYearId", ParseIntPipe) programYearId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<EducationProgramConfigurationAPIOutDTO> {
    try {
      return await this.educationProgramControllerService.getEducationProgramConfiguration(
        userToken.authorizations.institutionId,
        { programYearId },
      );
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND
      ) {
        throw new NotFoundException(
          "The provided program year does not have an active program configuration.",
        );
      }
      throw error;
    }
  }

  /**
   * Get the list of program years with at least one education program configuration.
   * @returns program years and whether they have an active program configuration.
   */
  @Get("program-years-list")
  async getProgramYearsList(): Promise<EducationProgramYearAPIOutDTO[]> {
    const programYears =
      await this.educationProgramManagerService.getProgramYears();
    return programYears.map((programYear) => ({
      id: programYear.id,
      description: programYear.programYear,
      hasActiveProgramConfiguration: programYear.hasActiveConfiguration,
    }));
  }

  /**
   * Creates a new education program for the provided program year.
   * Paired with the endpoint that provides the creation configuration
   * ({@link getEducationProgramForCreate}).
   * @param programYearId ID of the program year the program is being created for.
   * @param payload information to create the new program.
   * @param userToken the token of the user making the request.
   * @returns id of the created program.
   */
  @ApiNotFoundResponse({
    description:
      "The provided program year does not have an active program configuration.",
  })
  @ApiBadRequestResponse({
    description: "Education program data is not valid.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Education program configuration not found or " +
      "education program configuration outdated (not the active one for the program year) or " +
      "duplicate SABC code.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to create or modify a program.",
  })
  @Post("program-year/:programYearId/create")
  async createEducationProgram(
    @Param("programYearId", ParseIntPipe) programYearId: number,
    @Body() payload: CreateEducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    this.educationProgramControllerService.checkInstitutionAuthorization(
      userToken.authorizations,
    );
    try {
      const newProgram = await this.educationProgramSaveService.createProgram(
        programYearId,
        payload.programData as EducationProgramData,
        payload.programConfigurationId,
        userToken.authorizations.institutionId,
        userToken.userId,
      );
      return { id: newProgram.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND:
            throw new NotFoundException(
              "The provided program year does not have an active program configuration.",
            );
          case EDUCATION_PROGRAM_DATA_INVALID:
            throw new BadRequestException(error.objectInfo, error.message);
          case EDUCATION_PROGRAM_CONFIGURATION_OUTDATED:
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
   * Renews an existing education program, creating a new program
   * for the next program configuration.
   * Paired with the endpoint that provides the renewal configuration
   * ({@link getEducationProgramForRenew}).
   * @param programId ID of the education program to be renewed.
   * @param payload information to create the renewed program.
   * @param userToken the token of the user making the request.
   * @returns id of the created program.
   */
  @ApiNotFoundResponse({
    description: "Not able to find the education program.",
  })
  @ApiBadRequestResponse({
    description: "Education program data is not valid.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Education program has already been renewed or " +
      "next education program configuration for renewal not found or " +
      "education program configuration outdated (not the expected one for the renewal) or " +
      "duplicate SABC code.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to create or modify a program.",
  })
  @Post(":programId/renew")
  async renewEducationProgram(
    @Param("programId", ParseIntPipe) programId: number,
    @Body() payload: CreateEducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    this.educationProgramControllerService.checkInstitutionAuthorization(
      userToken.authorizations,
    );
    try {
      const newProgram = await this.educationProgramSaveService.renewProgram(
        programId,
        payload.programData as EducationProgramData,
        payload.programConfigurationId,
        userToken.authorizations.institutionId,
        userToken.userId,
      );
      return { id: newProgram.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case EDUCATION_PROGRAM_NOT_FOUND:
            throw new NotFoundException(error.message);
          case EDUCATION_PROGRAM_DATA_INVALID:
            throw new BadRequestException(error.objectInfo, error.message);
          case EDUCATION_PROGRAM_INVALID_OPERATION:
          case EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND:
            throw new UnprocessableEntityException(error.message);
          case EDUCATION_PROGRAM_CONFIGURATION_OUTDATED:
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
   * Updates the main information for an existing education program.
   * @param programId program to be updated.
   * @param payload information to be updated.
   */
  @ApiBadRequestResponse({
    description: "Education program data is not valid.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Education program configuration not found or not active or " +
      "education program cannot be edited when inactive or expired or " +
      "duplicate SABC code.",
  })
  @ApiNotFoundResponse({
    description: "Not able to find the education program.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to create or modify a program.",
  })
  @Patch(":programId")
  async updateEducationProgram(
    @Param("programId", ParseIntPipe) programId: number,
    @Body() payload: UpdateEducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    this.educationProgramControllerService.checkInstitutionAuthorization(
      userToken.authorizations,
    );
    try {
      await this.educationProgramSaveService.updateProgram(
        programId,
        payload.programData as EducationProgramData,
        userToken.authorizations.institutionId,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case EDUCATION_PROGRAM_NOT_FOUND:
            throw new NotFoundException(error.message);
          case EDUCATION_PROGRAM_DATA_INVALID:
            throw new BadRequestException(error.objectInfo, error.message);
          case EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND:
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
   * Allows a program to be deactivated.
   * @param programId program to be deactivated.
   */
  @ApiNotFoundResponse({
    description: "Not able to find the education program.",
  })
  @ApiUnprocessableEntityResponse({
    description: "The education program is already set as requested.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to create or modify a program.",
  })
  @Patch(":programId/deactivate")
  async deactivateProgram(
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    this.educationProgramControllerService.checkInstitutionAuthorization(
      userToken.authorizations,
    );
    await this.educationProgramControllerService.deactivateProgram(
      programId,
      userToken.userId,
      { institutionId: userToken.authorizations.institutionId },
    );
  }

  /**
   * Get a key/value pair list of all approved programs.
   * @param isIncludeInActiveProgram if true, then both active
   * and not active education program is considered.
   * @returns key/value pair list of all approved programs.
   */
  @Get("programs-list")
  async getProgramsListForInstitutions(
    @UserToken() userToken: IInstitutionUserToken,
    @Query(
      "isIncludeInActiveProgram",
      new DefaultValuePipe(false),
      ParseBoolPipe,
    )
    isIncludeInActiveProgram: boolean,
  ): Promise<OptionItemAPIOutDTO[]> {
    return this.educationProgramControllerService.getProgramsListForInstitutions(
      userToken.authorizations.institutionId,
      { isIncludeInActiveProgram },
    );
  }

  /**
   * Get the list of education programs for a specific program year.
   * @param programYearId ID of the program year.
   * @param pagination Pagination options for the results.
   * @param userToken User token containing authorization information.
   * @returns Paginated list of education programs for the specified program year.
   */
  @ApiNotFoundResponse({
    description: "Program year not found.",
  })
  @Get("program-year/:programYearId/summary")
  async getProgramsForProgramYear(
    @Param("programYearId", ParseIntPipe)
    programYearId: number,
    @Query() pagination: ProgramsManagementPaginationOptionsAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PaginatedResults<EducationProgramManagerDetailsAPIOutDTO>> {
    const programYearExists = await this.programYearService.programYearExists(
      programYearId,
      { activeOnly: false },
    );
    if (!programYearExists) {
      throw new NotFoundException("Program year not found.");
    }
    const [nextProgramConfigurationForRenewal, paginatedPrograms] =
      await Promise.all([
        this.educationProgramManagerService.getNextProgramConfigurationForRenewal(
          programYearId,
        ),
        this.educationProgramManagerService.getEducationProgramsManagerDetails(
          userToken.authorizations.institutionId,
          programYearId,
          pagination,
        ),
      ]);
    return {
      count: paginatedPrograms.count,
      results: paginatedPrograms.results.map((program) => ({
        id: program.id,
        name: program.name,
        credentialTypeToDisplay: credentialTypeToDisplay(
          program.credentialType,
        ),
        cipCode: program.cipCode,
        sabcCode: program.sabcCode,
        programStatus: program.programStatus,
        isActive: program.isActive,
        isExpired: program.isExpired,
        renewalStatus: program.renewedProgram
          ? ProgramRenewalStatus.Renewed
          : nextProgramConfigurationForRenewal
            ? ProgramRenewalStatus.Available
            : ProgramRenewalStatus.NotAvailable,
      })),
    };
  }

  /**
   * Get the education program information.
   * @param programId program id.
   * @returns programs information.
   * */
  @ApiNotFoundResponse({
    description: "Not able to find the requested program.",
  })
  @Get(":programId")
  async getEducationProgram(
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<EducationProgramAPIOutDTO> {
    return this.educationProgramControllerService.getEducationProgram(
      programId,
      userToken.authorizations.institutionId,
    );
  }

  /**
   * Get the program configuration for renewal.
   * It includes a new program context and the data from the previous program.
   * Paired with the renewal endpoint ({@link renewEducationProgram}).
   * @param programId the ID of the education program to be renewed.
   * @param userToken the token of the user making the request.
   * @returns the next program configuration for renewal.
   */
  @ApiNotFoundResponse({
    description: "Not able to find the requested program.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "The next program configuration for renewal could not be found.",
  })
  @Get(":programId/renew")
  async getEducationProgramForRenew(
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<EducationProgramConfigurationAPIOutDTO> {
    const program =
      await this.educationProgramService.getEducationProgramDetails(
        programId,
        userToken.authorizations.institutionId,
      );
    if (!program) {
      throw new NotFoundException("Not able to find the requested program.");
    }
    const nextProgramConfigurationForRenewal =
      await this.educationProgramManagerService.getNextProgramConfigurationForRenewal(
        program.programConfiguration.programYear.id,
      );
    if (!nextProgramConfigurationForRenewal) {
      throw new UnprocessableEntityException(
        "The next program configuration for renewal could not be found.",
      );
    }
    return this.educationProgramControllerService.getEducationProgramConfiguration(
      userToken.authorizations.institutionId,
      { programConfigurationId: nextProgramConfigurationForRenewal.id },
      { overrideProgramData: program.programData },
    );
  }

  /**
   * Evaluate program's calculated data based on the provided data and key.
   * @param payload contains the data and key for evaluation.
   * @param userToken the token of the user making the request.
   * @returns the calculated data based on the evaluation.
   */
  @Post("evaluate")
  async evaluate(
    @Body() payload: ProgramEvaluationAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<ProgramEvaluationAPIOutDTO> {
    this.educationProgramControllerService.checkInstitutionAuthorization(
      userToken.authorizations,
    );
    const calculatedData =
      await this.educationProgramEvaluationService.evaluate(
        userToken.authorizations.institutionId,
        payload.calculatedDataKeys,
        payload.data,
      );
    return { calculatedData };
  }
}
