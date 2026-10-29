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
  EducationProgramsSummaryLocationAPIOutDTO,
  ProgramEvaluationAPIInDTO,
  ProgramEvaluationAPIOutDTO,
  UpdateEducationProgramAPIInDTO,
} from "./models/education-program.dto";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  PaginatedResultsAPIOutDTO,
  ProgramsLocationPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { EducationProgramService } from "../../services/education-program/education-program.service";
import { EducationProgramControllerService } from "../../route-controllers/education-program/education-program.controller.service";
import { OfferingTypes } from "@sims/sims-db/entities/offering.type";
import { credentialTypeToDisplay } from "../../utilities";
import { CustomNamedError, isSameOrAfterDate } from "@sims/utilities";
import { EducationProgramEvaluationService } from "../../services/education-program/education-program-evaluator";
import {
  EducationProgramData,
  EducationProgramSaveService,
} from "../../services";
import {
  EDUCATION_PROGRAM_INVALID_OPERATION,
  DUPLICATE_SABC_CODE,
  EDUCATION_PROGRAM_NOT_FOUND,
  EDUCATION_PROGRAM_DATA_INVALID,
  EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND,
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
   * Get the program configuration including context, visual schema, and validation schema.
   * @param programConfigurationId ID of the program configuration. If not provided,
   * the most recent active configuration is returned.
   * @returns the program configuration including context, visual schema, and validation schema.
   */
  @ApiNotFoundResponse({
    description: "Not able to find an active program configuration.",
  })
  // TODO: The endpoint should require a configuration ID once the client is updated to always provide it.
  @Get(["configuration", "configuration/:programConfigurationId"])
  async getEducationProgramConfiguration(
    @UserToken() userToken: IInstitutionUserToken,
    @Param("programConfigurationId", new ParseIntPipe({ optional: true }))
    programConfigurationId?: number,
  ): Promise<EducationProgramConfigurationAPIOutDTO> {
    try {
      const configuration =
        await this.educationProgramSaveService.getEducationProgramConfiguration(
          userToken.authorizations.institutionId,
          { programConfigurationId },
        );
      return {
        configurationId: configuration.configurationId,
        programData: {
          context: {
            hasOfferings: configuration.context.hasOfferings,
            isBCPrivate: configuration.context.isBCPrivate,
            isBCInstitution: configuration.context.isBCInstitution,
          },
        },
        visualSchema: configuration.visualSchema,
        validationSchema: configuration.validationSchema,
      };
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND
      ) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  /**
   * Creates a new education program.
   * @param payload information to create the new program.
   * @returns id of the created program.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Education program data is not valid or " +
      "education program configuration not found or not active or " +
      "duplicate SABC code.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to create or modify a program.",
  })
  @Post()
  async createEducationProgram(
    @Body() payload: CreateEducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    this.educationProgramControllerService.checkInstitutionAuthorization(
      userToken.authorizations,
    );
    try {
      const newProgram = await this.educationProgramSaveService.createProgram(
        payload.programData as EducationProgramData,
        payload.programConfigurationId,
        userToken.authorizations.institutionId,
        userToken.userId,
      );
      return { id: newProgram.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case EDUCATION_PROGRAM_DATA_INVALID:
            throw new BadRequestException(error.objectInfo, error.message);
          case EDUCATION_PROGRAM_CONFIGURATION_NOT_FOUND:
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
   * Updates the main information for an existing education program.
   * @param programId program to be updated.
   * @param payload information to be updated.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Education program data is not valid or " +
      "education program configuration not found or not active or " +
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
