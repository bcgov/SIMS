import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  IInstitutionUserToken,
  IUserToken,
} from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
  Groups,
} from "../../auth/decorators";
import {
  EducationProgramDto,
  EducationProgramDataDto,
  transformToEducationProgramData,
  ProgramsSummary,
  DeclineProgram,
  ApproveProgram,
} from "./models/save-education-program.dto";
import { EducationProgramService, FormService } from "../../services";
import { FormNames } from "../../services/form/constants";
import {
  SaveEducationProgram,
  EducationProgramsSummary,
} from "../../services/education-program/education-program.service.models";
import { SubsetEducationProgramDto } from "./models/summary-education-program.dto";
import { EducationProgram, OfferingTypes } from "../../database/entities";
import { OptionItem } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
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

@Controller("institution/education-program")
@ApiTags("institution")
export class EducationProgramController extends BaseController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly formService: FormService,
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
    @Param("locationId") locationId: number,
    @Query("searchCriteria") searchCriteria: string,
    @Query("sortField") sortField: string,
    @Query("sortOrder") sortOrder: FieldSortOrder,
    @UserToken() userToken: IInstitutionUserToken,
    @Query("page") page = DEFAULT_PAGE_NUMBER,
    @Query("pageLimit") pageLimit = DEFAULT_PAGE_LIMIT,
  ): Promise<PaginatedResults<EducationProgramsSummary>> {
    // [OfferingTypes.applicationSpecific] offerings are
    // created during PIR, if required, and they are supposed
    // to be viewed only associated to the application that they
    // were associated to during the PIR, hence they should not
    // be displayed alongside with the public offerings.
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
    @Body() payload: EducationProgramDto,
    @Param("id") id: number,
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
    @Param("programId") programId: number,
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
   * Get a key/value pair list of all programs that have
   * at least one offering for the particular location.
   * Executes the students-based authorization
   * (students must have access to all programs).
   * @param locationId location id.
   * @query includeInActivePY includeInActivePY, if includeInActivePY, then both active
   * and not active program year is considered
   * @returns key/value pair list of programs.
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("location/:locationId/program-year/:programYearId/options-list")
  async getLocationProgramsOptionList(
    @Param("locationId") locationId: number,
    @Param("programYearId") programYearId: number,
    @Query("includeInActivePY") includeInActivePY = false,
  ): Promise<OptionItem[]> {
    const programs = await this.programService.getProgramsForLocation(
      locationId,
      programYearId,
      includeInActivePY,
    );

    return programs.map((program) => ({
      id: program.id,
      description: program.name,
    }));
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
   * Get program details for an program id.
   * @param userToken User token from request.
   * @param id program id
   * @query locationId location id
   * @returns programs DTO.
   * ! This dynamic router will conflict with its similar patter router,
   * ! eg, @Get("programs-list"). so, always move @Get(":id") below all
   * ! router that have similar pattern to @Get(":id"),
   * ! i.e , Dynamic api should be on bottom
   * ! ref: https://stackoverflow.com/questions/58707933/node-js-express-route-conflict-issue
   * ! https://poopcode.com/how-to-resolve-parameterized-route-conficts-in-express-js/
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @Get(":id")
  async getProgram(
    @Param("id") id: number,
    @Query("locationId") locationId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<EducationProgramDto> {
    const program =
      await this.programService.getInstitutionProgramWithTotalOfferings(
        id,
        userToken.authorizations.institutionId,
        locationId,
      );

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
      totalOfferings: program.totalOfferings,
      locationId: locationId,
    };
  }

  /**
   * Education Program Details for ministry users
   * @param programId program id
   * @returns programs details.
   * */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get(":programId/aest")
  async getProgramForAEST(
    @Param("programId") programId: number,
  ): Promise<EducationProgramDataDto> {
    const program = await this.programService.getEducationProgramDetails(
      programId,
    );
    if (!program) {
      throw new NotFoundException("Not able to find the requested program.");
    }

    return transformToEducationProgramData(program);
  }

  /**
   * Get all programs of an institution with pagination
   * for ministry users
   * @param institutionId id of the institution.
   * @param pageSize is the number of rows shown in the table
   * @param page is the number of rows that is skipped/offset from the total list.
   * For example page 2 the skip would be 10 when we select 10 rows per page.
   * @param sortColumn the sorting column.
   * @param sortOrder sorting order.
   * @param searchCriteria Search the program name in the query
   * @returns ProgramsSummaryPaginated.
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Get("institution/:institutionId/aest")
  async getPaginatedProgramsForAEST(
    @Param("institutionId") institutionId: number,
    @Query("pageSize") pageSize: number,
    @Query("page") page: number,
    @Query("sortColumn") sortColumn: string,
    @Query("sortOrder") sortOrder: FieldSortOrder,
    @Query("searchCriteria") searchCriteria: string,
  ): Promise<PaginatedResults<ProgramsSummary>> {
    return this.programService.getPaginatedProgramsForAEST(
      institutionId,
      [OfferingTypes.Public, OfferingTypes.Private],
      {
        searchCriteria: searchCriteria,
        sortField: sortColumn,
        sortOrder: sortOrder,
        page: page,
        pageLimit: pageSize,
      },
    );
  }

  /**
   * Ministry user approve's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @UserToken userToken
   * @Body payload
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Patch(":programId/institution/:institutionId/approve/aest")
  async approveProgram(
    @UserToken() userToken: IUserToken,
    @Param("programId") programId: number,
    @Param("institutionId") institutionId: number,
    @Body() payload: ApproveProgram,
  ): Promise<void> {
    await this.programService.approveEducationProgram(
      institutionId,
      programId,
      userToken.userId,
      payload,
    );
  }

  /**
   * Ministry user decline's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @UserToken userToken
   * @Body payload
   */
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Groups(UserGroups.AESTUser)
  @Patch(":programId/institution/:institutionId/decline/aest")
  async declineProgram(
    @UserToken() userToken: IUserToken,
    @Param("programId") programId: number,
    @Param("institutionId") institutionId: number,
    @Body() payload: DeclineProgram,
  ): Promise<void> {
    await this.programService.declineEducationProgram(
      institutionId,
      programId,
      userToken.userId,
      payload,
    );
  }
}
