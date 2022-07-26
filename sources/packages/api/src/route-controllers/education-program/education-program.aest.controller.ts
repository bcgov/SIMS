import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { IUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken, Groups } from "../../auth/decorators";
import {
  DeclineProgramAPIInDTO,
  ApproveProgramAPIInDTO,
} from "./models/education-program.dto";
import { EducationProgramService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  PaginatedResultsAPIOutDTO,
  ProgramsPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import {
  AESTEducationProgramAPIOutDTO,
  EducationProgramsSummaryAPIOutDTO,
} from "./models/education-program.dto";
import { EducationProgramControllerService } from "./education-program.controller.service";
import {
  credentialTypeToDisplay,
  getISODateOnlyString,
  getUserFullName,
  INSTITUTION_TYPE_BC_PRIVATE,
} from "../../utilities";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("education-program")
@ApiTags(`${ClientTypeBaseRoute.AEST}-education-program`)
export class EducationProgramAESTController extends BaseController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly educationProgramControllerService: EducationProgramControllerService,
  ) {
    super();
  }

  /**
   * Education Program Details for ministry users.
   * @param programId program id.
   * @returns programs details.
   * */
  @Get(":programId")
  async getEducationProgram(
    @Param("programId", ParseIntPipe) programId: number,
  ): Promise<AESTEducationProgramAPIOutDTO> {
    const program = await this.programService.getEducationProgramDetails(
      programId,
    );
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
      institutionId: program.institution.id,
      institutionName: program.institution.operatingName,
      submittedDate: program.submittedDate,
      submittedBy: getUserFullName(program.submittedBy),
      effectiveEndDate: getISODateOnlyString(program.effectiveEndDate),
      assessedDate: program.assessedDate,
      assessedBy: getUserFullName(program.assessedBy),
      isBCPrivate:
        program.institution.institutionType.id === INSTITUTION_TYPE_BC_PRIVATE,
    };
  }

  /**
   * Get the programs summary of an institution with pagination.
   * @param institutionId id of the institution.
   * @param paginationOptions pagination options.
   * @returns paginated programs summary.
   */
  @Get("institution/:institutionId/summary")
  async getProgramsSummaryByInstitutionId(
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Query() paginationOptions: ProgramsPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<EducationProgramsSummaryAPIOutDTO>> {
    return this.educationProgramControllerService.getProgramsSummary(
      institutionId,
      paginationOptions,
    );
  }

  /**
   * Ministry user approve's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @param payload information to approve the program.
   */
  @Patch(":programId/institution/:institutionId/approve")
  async approveProgram(
    @UserToken() userToken: IUserToken,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: ApproveProgramAPIInDTO,
  ): Promise<void> {
    await this.programService.approveEducationProgram(
      new Date(payload.effectiveEndDate),
      payload.approvedNote,
      institutionId,
      programId,
      userToken.userId,
    );
  }

  /**
   * Ministry user decline's a pending program.
   * @param programId program id.
   * @param institutionId institution id.
   * @UserToken userToken
   * @Body payload
   */
  @Patch(":programId/institution/:institutionId/decline")
  async declineProgram(
    @UserToken() userToken: IUserToken,
    @Param("programId", ParseIntPipe) programId: number,
    @Param("institutionId", ParseIntPipe) institutionId: number,
    @Body() payload: DeclineProgramAPIInDTO,
  ): Promise<void> {
    await this.programService.declineEducationProgram(
      payload.declinedNote,
      institutionId,
      programId,
      userToken.userId,
    );
  }
}
