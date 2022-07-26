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
  UnprocessableEntityException,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import { EducationProgramDto } from "./models/save-education-program.dto";
import { FormNames } from "../../services/form/constants";
import {
  SaveEducationProgram,
  EducationProgramsSummary,
} from "../../services/education-program/education-program.service.models";
import {
  EducationProgramAPIOutDTO,
  EducationProgramDetailsAPIOutDTO,
} from "./models/education-program.dto";
import { EducationProgram } from "../../database/entities";
import { ClientTypeBaseRoute, OptionItem } from "../../types";
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
  FormService,
  EducationProgramOfferingService,
} from "../../services";
import {
  PaginatedResultsAPIOutDTO,
  ProgramsPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { EducationProgramControllerService } from "..";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("education-program")
@ApiTags(`${ClientTypeBaseRoute.Institution}-education-program`)
export class EducationProgramInstitutionsController extends BaseController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly formService: FormService,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
    private readonly educationProgramControllerService: EducationProgramControllerService,
  ) {
    super();
  }

  /**
   * Get programs for a particular institution with pagination.
   * @param locationId id of the location.
   * @param paginationOptions pagination options.
   * @returns paginated programs summary.
   */
  @HasLocationAccess("locationId")
  @Get("location/:locationId/summary")
  async getProgramsSummary(
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
  async create(
    @Body() payload: EducationProgramDto,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<number> {
    const newProgram = await this.saveProgram(userToken, payload);
    return newProgram.id;
  }

  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() payload: EducationProgramDto,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<void> {
    // Ensures that the user has access to the institution
    // associated with the program id being updated.
    const program = await this.programService.getInstitutionProgram(
      id,
      userToken.authorizations.institutionId,
    );
    if (!program) {
      throw new NotFoundException("Not able to find the requested program.");
    }

    await this.saveProgram(userToken, payload, id);
  }

  /**
   * Saves program (insert/update).
   * @param userToken User token from request.
   * @param payload Payload with data to be persisted.
   * @param [programId] If provided will update the record, otherwise will insert a new one.
   * @returns program
   */
  private async saveProgram(
    userToken: IInstitutionUserToken,
    payload: EducationProgramDto,
    programId?: number,
  ): Promise<EducationProgram> {
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.Educationprogram,
      payload,
    );

    if (!submissionResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to a save the program due to an invalid request.",
      );
    }

    // The payload returned from form.io contains the approvalStatus as
    // a calculated server value. If the approvalStatus value is sent
    // from the client form it will be overridden by the server calculated one.
    const saveProgramPaylod: SaveEducationProgram = {
      ...submissionResult.data.data,
      programDeliveryTypes: submissionResult.data.data.programDeliveryTypes,
      institutionId: userToken.authorizations.institutionId,
      id: programId,
      userId: userToken.userId,
    };
    return this.programService.saveEducationProgram(saveProgramPaylod);
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
  ): Promise<OptionItem[]> {
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
   * @param id program id
   * @returns program information.
   * ! This dynamic router will conflict with its similar patter router,
   * ! eg, @Get("programs-list"). so, always move @Get(":id") below all
   * ! router that have similar pattern to @Get(":id"),
   * ! i.e , Dynamic api should be on bottom
   * ! ref: https://stackoverflow.com/questions/58707933/node-js-express-route-conflict-issue
   * ! https://poopcode.com/how-to-resolve-parameterized-route-conficts-in-express-js/
   */
  @Get(":id")
  async getEducationProgram(
    @Param("id", ParseIntPipe) id: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<EducationProgramAPIOutDTO> {
    const programRequest = this.programService.getInstitutionProgram(
      id,
      userToken.authorizations.institutionId,
    );

    const hasOfferings =
      this.educationProgramOfferingService.hasExistingOffering(id);

    const [program, hasOfferingsResponse] = await Promise.all([
      programRequest,
      hasOfferings,
    ]);

    if (!program) {
      throw new NotFoundException("Not able to find the requested program.");
    }

    return {
      institutionId: program.institution.id,
      name: program.name,
      description: program.description,
      credentialType: program.credentialType,
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
      hasOfferings: hasOfferingsResponse,
      isBCPrivate:
        program.institution.institutionType.id === INSTITUTION_TYPE_BC_PRIVATE,
    };
  }
}
