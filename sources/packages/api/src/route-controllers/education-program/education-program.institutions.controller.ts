import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import { EducationProgramAPIInDTO } from "./models/education-program.dto";
import { EducationProgramsSummary } from "../../services/education-program/education-program.service.models";
import {
  EducationProgramAPIOutDTO,
  EducationProgramDetailsAPIOutDTO,
} from "./models/education-program.dto";
import { ClientTypeBaseRoute } from "../../types";
import {
  credentialTypeToDisplay,
  getISODateOnlyString,
  getUserFullName,
  INSTITUTION_TYPE_BC_PRIVATE,
} from "../../utilities";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  EducationProgramService,
  EducationProgramOfferingService,
} from "../../services";
import {
  PaginatedResultsAPIOutDTO,
  ProgramsPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { EducationProgramControllerService } from "..";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { OptionItemAPIOutDTO } from "../models/common.dto";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("education-program")
@ApiTags(`${ClientTypeBaseRoute.Institution}-education-program`)
export class EducationProgramInstitutionsController extends BaseController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
    private readonly educationProgramControllerService: EducationProgramControllerService,
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
    @Query() paginationOptions: ProgramsPaginationOptionsAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummary>> {
    return this.educationProgramControllerService.getProgramsSummary(
      userToken.authorizations.institutionId,
      paginationOptions,
      locationId,
    );
  }

  @Post()
  async createEducationProgram(
    @Body() payload: EducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const newProgram = await this.educationProgramControllerService.saveProgram(
      payload,
      userToken.authorizations.institutionId,
      userToken.userId,
    );
    return { id: newProgram.id };
  }

  @Put(":programId")
  async update(
    @Param("programId", ParseIntPipe) programId: number,
    @Body() payload: EducationProgramAPIInDTO,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    await this.educationProgramControllerService.saveProgram(
      payload,
      userToken.authorizations.institutionId,
      userToken.userId,
      programId,
    );
  }

  /**
   * Returns only the subset of the education program to get
   * the complete education program use the @Get(":id") method.
   * @param programId program id.
   * @returns subset of the education program.
   */
  @Get(":programId/details")
  async getEducationProgramDetails(
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<EducationProgramDetailsAPIOutDTO> {
    const educationProgram = await this.programService.getLocationPrograms(
      programId,
      userToken.authorizations.institutionId,
    );
    const programDetails: EducationProgramDetailsAPIOutDTO = {
      id: educationProgram.id,
      name: educationProgram.name,
      description: educationProgram.description,
      credentialType: educationProgram.credentialType,
      credentialTypeToDisplay: credentialTypeToDisplay(
        educationProgram.credentialType,
      ),
      cipCode: educationProgram.cipCode,
      nocCode: educationProgram.nocCode,
      sabcCode: educationProgram.sabcCode,
      programStatus: educationProgram.programStatus,
      programIntensity: educationProgram.programIntensity,
      institutionProgramCode: educationProgram.institutionProgramCode,
      submittedDate: educationProgram.submittedDate,
      submittedBy: getUserFullName(educationProgram.submittedBy),
      effectiveEndDate: getISODateOnlyString(educationProgram.effectiveEndDate),
      assessedDate: educationProgram.assessedDate,
      assessedBy: getUserFullName(educationProgram.assessedBy),
      institutionName: educationProgram.institution.operatingName,
    };
    return programDetails;
  }

  /**
   * Get a key/value pair list of all programs.
   * @param userToken User token from request.
   * @returns key/value pair list of programs.
   * ! This is conflicting with @Get(":id"),
   * ! so, always move @Get(":id") below all
   * ! router that have similar pattern to @Get(":id"),
   * ! i.e , Dynamic api should be on bottom
   * ! ref: https://stackoverflow.com/questions/58707933/node-js-express-route-conflict-issue
   * ! https://poopcode.com/how-to-resolve-parameterized-route-conficts-in-express-js/
   */
  @Get("programs-list")
  async getLocationProgramsOptionListForInstitution(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<OptionItemAPIOutDTO[]> {
    const programs = await this.programService.getPrograms(
      userToken.authorizations.institutionId,
    );
    return programs.map((program) => ({
      id: program.id,
      description: program.name,
    }));
  }

  /**
   * Get program details for a program id.
   * @param programId program id
   * @returns program information.
   */
  @Get(":programId")
  async getEducationProgram(
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<EducationProgramAPIOutDTO> {
    const programPromise = this.programService.getInstitutionProgram(
      programId,
      userToken.authorizations.institutionId,
    );

    const hasOfferingsPromise =
      this.educationProgramOfferingService.hasExistingOffering(programId);

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
      minHoursWeekAvi: program.minHoursWeekAvi,
      entranceRequirements: {
        hasMinimumAge: program.hasMinimumAge,
        minHighSchool: program.minHighSchool,
        requirementsByInstitution: program.requirementsByInstitution,
        requirementsByBCITA: program.requirementsByBCITA,
      },
      hasWILComponent: program.hasWILComponent,
      isWILApproved: program.isWILApproved,
      wilProgramEligibility: program.wilProgramEligibility,
      hasTravel: program.hasTravel,
      travelProgramEligibility: program.travelProgramEligibility,
      hasIntlExchange: program.hasIntlExchange,
      intlExchangeProgramEligibility: program.intlExchangeProgramEligibility,
      programDeclaration: program.programDeclaration,
      hasOfferings: hasOfferings,
      institutionId: program.institution.id,
      institutionName: program.institution.operatingName,
      isBCPrivate:
        program.institution.institutionType.id === INSTITUTION_TYPE_BC_PRIVATE,
    };
  }
}
