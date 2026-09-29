import {
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
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import {
  CreateEducationProgramDynamicAPIInDTO,
  EducationProgramAPIInDTO,
  EducationProgramAPIOutDTO,
  EducationProgramConfigurationAPIOutDTO,
  EducationProgramDynamicAPIInDTO,
  EducationProgramDynamicAPIOutDTO,
  EducationProgramsSummaryLocationAPIOutDTO,
  ProgramEvaluationAPIInDTO,
  ProgramEvaluationAPIOutDTO,
} from "./models/education-program.dto";
import { ClientTypeBaseRoute } from "../../types";
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
import { credentialTypeToDisplay, getUserFullName } from "../../utilities";
import { getISODateOnlyString, isSameOrAfterDate } from "@sims/utilities";
import { EducationProgramEvaluationService } from "../../services/education-program/education-program-evaluator";
import { EducationProgram, EducationProgramConfiguration } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EducationProgramOfferingService } from "../../services";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("education-program")
@ApiTags(`${ClientTypeBaseRoute.Institution}-education-program`)
export class EducationProgramInstitutionsController extends BaseController {
  constructor(
    private readonly educationProgramService: EducationProgramService,
    private readonly educationProgramControllerService: EducationProgramControllerService,
    private readonly educationProgramEvaluationService: EducationProgramEvaluationService,
    @InjectRepository(EducationProgramConfiguration)
    private readonly educationProgramConfigurationRepo: Repository<EducationProgramConfiguration>,
    @InjectRepository(EducationProgram)
    private readonly educationProgramRepo: Repository<EducationProgram>,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
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
   * Creates a new education program.
   * @param payload information to create the new program.
   * @returns id of the created program.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to a save the program due to an invalid request or " +
      "duplicate SABC code.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to create or modify a program.",
  })
  @Post()
  async createEducationProgram(
    @Body() payload: EducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    this.educationProgramControllerService.checkInstitutionAuthorization(
      userToken.authorizations,
    );
    const newProgram = await this.educationProgramControllerService.saveProgram(
      payload,
      userToken.authorizations.institutionId,
      userToken.userId,
    );
    return { id: newProgram.id };
  }

  /**
   * Updates the main information for an existing education program.
   * @param programId program to be updated.
   * @param payload information to be updated.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to a save the program due to an invalid request or " +
      "SABC code is duplicated or " +
      "program is inactive.",
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
    @Body() payload: EducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    this.educationProgramControllerService.checkInstitutionAuthorization(
      userToken.authorizations,
    );
    await this.educationProgramControllerService.saveProgram(
      payload,
      userToken.authorizations.institutionId,
      userToken.userId,
      programId,
    );
  }

  /**
   * Creates a new education program from its dynamic data, validated
   * against the provided program configuration.
   * @param payload program configuration and dynamic data of the new program.
   * @returns id of the created program.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to a save the program due to an invalid program data or " +
      "program configuration not found or not active or " +
      "duplicate SABC code.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to create or modify a program.",
  })
  @Post("dynamic")
  async createEducationProgramDynamic(
    @Body() payload: CreateEducationProgramDynamicAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    this.educationProgramControllerService.checkInstitutionAuthorization(
      userToken.authorizations,
    );
    const newProgram =
      await this.educationProgramControllerService.saveProgramDynamic(
        payload.programData,
        userToken.authorizations.institutionId,
        userToken.userId,
        { programConfigurationId: payload.programConfigurationId },
      );
    return { id: newProgram.id };
  }

  /**
   * Updates an existing education program from its dynamic data, validated
   * against the program configuration the program was created with.
   * @param programId program to be updated.
   * @param payload dynamic data of the program.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Not able to a save the program due to an invalid program data or " +
      "SABC code is duplicated or " +
      "program is inactive.",
  })
  @ApiNotFoundResponse({
    description: "Not able to find the education program.",
  })
  @ApiForbiddenResponse({
    description: "You are not authorized to create or modify a program.",
  })
  @Patch(":programId/dynamic")
  async updateEducationProgramDynamic(
    @Param("programId", ParseIntPipe) programId: number,
    @Body() payload: EducationProgramDynamicAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    this.educationProgramControllerService.checkInstitutionAuthorization(
      userToken.authorizations,
    );
    await this.educationProgramControllerService.saveProgramDynamic(
      payload.programData,
      userToken.authorizations.institutionId,
      userToken.userId,
      { programId },
    );
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
   * Get the education program information.
   * @param programId program id.
   * @returns programs information.
   * */
  @ApiNotFoundResponse({
    description: "Not able to find the requested program.",
  })
  @Get(":programId/dynamic")
  async getEducationProgramDynamic(
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<EducationProgramDynamicAPIOutDTO> {
    const programPromise = this.educationProgramRepo.findOne({
      select: {
        id: true,
        programData: true,
        programConfiguration: {
          id: true,
          visualSchema: true,
          validationSchema: true,
        },
        institution: {
          id: true,
          operatingName: true,
          institutionType: {
            id: true,
          },
        },
        isActive: true,
        submittedDate: true,
        submittedBy: { id: true, firstName: true, lastName: true },
        assessedDate: true,
        assessedBy: { id: true, firstName: true, lastName: true },
        effectiveEndDate: true,
      },
      relations: {
        institution: { institutionType: true },
        programConfiguration: true,
        submittedBy: true,
        assessedBy: true,
      },
      where: {
        id: programId,
        institution: { id: userToken.authorizations.institutionId },
      },
    });
    const hasOfferingsPromise =
      this.educationProgramOfferingService.hasExistingOffering(programId);
    // Wait for the program and for the offering check to be retrieved.
    const [program, hasOfferings] = await Promise.all([
      programPromise,
      hasOfferingsPromise,
    ]);

    if (!program) {
      throw new NotFoundException("Education program not found.");
    }
    return {
      id: program.id,
      programData: {
        ...(program.programData as Record<string, unknown>),
        context: {
          hasOfferings: hasOfferings,
          isActive: program.isActive && !program.isExpired,
          isBCPublic: program.institution.institutionType.isBCPublic,
          isBCPrivate: program.institution.institutionType.isBCPrivate,
          isBCInstitution:
            program.institution.institutionType.isBCPrivate ||
            program.institution.institutionType.isBCPublic,
        },
      },
      visualSchema: program.programConfiguration.visualSchema,
      validationSchema: program.programConfiguration.validationSchema,
      institutionId: program.institution.id,
      institutionName: program.institution.operatingName,
      submittedDate: program.submittedDate,
      submittedBy: getUserFullName(program.submittedBy),
      assessedDate: program.assessedDate,
      assessedBy: getUserFullName(program.assessedBy),
      effectiveEndDate: getISODateOnlyString(program.effectiveEndDate),
      isExpired: program.isExpired,
    };
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

  @Get("program-year/:programYearId/configuration")
  async getEducationProgramConfiguration(
    @Param("programYearId", ParseIntPipe) programYearId: number,
  ): Promise<EducationProgramConfigurationAPIOutDTO> {
    const configuration = await this.educationProgramConfigurationRepo.findOne({
      select: { id: true, validationSchema: true, visualSchema: true },
      where: { programYear: { id: programYearId }, isActive: true },
    });
    if (!configuration) {
      throw new NotFoundException("Education program configuration not found.");
    }
    return {
      id: configuration.id,
      validationSchema: configuration.validationSchema,
      visualSchema: configuration.visualSchema,
    };
  }
}
