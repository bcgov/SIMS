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
import {
  EducationProgramDto,
  EducationProgramAPIOutDTO,
} from "./models/save-education-program.dto";
import { FormNames } from "../../services/form/constants";
import {
  SaveEducationProgram,
  EducationProgramsSummary,
} from "../../services/education-program/education-program.service.models";
import { SubsetEducationProgramDto } from "./models/education-program.dto";
import { EducationProgram, OfferingTypes } from "../../database/entities";
import { ClientTypeBaseRoute, OptionItem } from "../../types";
import {
  credentialTypeToDisplay,
  FieldSortOrder,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  PaginatedResults,
  getISODateOnlyString,
  getUserFullName,
} from "../../utilities";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  EducationProgramService,
  FormService,
  EducationProgramOfferingService,
} from "../../services";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("education-program")
@ApiTags(`${ClientTypeBaseRoute.Institution}-education-program`)
export class EducationProgramInstitutionsController extends BaseController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly formService: FormService,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
  ) {
    super();
  }

  /**
   * Get programs for a particular institution with pagination.
   * @param locationId id of the location.
   * @param pageLimit is the number of rows shown in the table
   * @param page is the number of rows that is skipped/offset from the total list.
   * For example page 2 the skip would be 10 when we select 10 rows per page.
   * @param sortField the sorting column.
   * @param sortOrder sorting order.
   * @param searchCriteria Search the program name in the query
   * @returns PaginatedResults<EducationProgramsSummary>.
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get("location/:locationId/summary")
  async getSummary(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Query("searchCriteria") searchCriteria: string,
    @Query("sortField") sortField: string,
    @Query("sortOrder") sortOrder: FieldSortOrder,
    @Query("page") page = DEFAULT_PAGE_NUMBER,
    @Query("pageLimit") pageLimit = DEFAULT_PAGE_LIMIT,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<PaginatedResults<EducationProgramsSummary>> {
    return this.programService.getSummaryForLocation(
      userToken.authorizations.institutionId,
      locationId,
      [OfferingTypes.Public, OfferingTypes.Private],
      {
        searchCriteria: searchCriteria,
        sortField: sortField,
        sortOrder: sortOrder,
        page: page,
        pageLimit: pageLimit,
      },
    );
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @Post()
  async create(
    @Body() payload: EducationProgramDto,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<number> {
    const newProgram = await this.saveProgram(userToken, payload);
    return newProgram.id;
  }

  @AllowAuthorizedParty(AuthorizedParties.institution)
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
   * This returns only the subset of the EducationProgram to get
   * the complete EducationProgram DTO use the @Get(":id") method
   * @param programId
   * @returns
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @Get(":programId/details")
  async getProgramDetails(
    @Param("programId", ParseIntPipe) programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<SubsetEducationProgramDto> {
    const educationProgram = await this.programService.getLocationPrograms(
      programId,
      userToken.authorizations.institutionId,
    );
    const programDetails: SubsetEducationProgramDto = {
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
  @AllowAuthorizedParty(AuthorizedParties.institution)
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
  @AllowAuthorizedParty(AuthorizedParties.institution)
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
    };
  }
}
