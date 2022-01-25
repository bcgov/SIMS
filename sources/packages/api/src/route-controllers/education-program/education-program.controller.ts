import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
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
  Groups,
} from "../../auth/decorators";
import {
  EducationProgramDto,
  EducationProgramData,
} from "./models/save-education-program.dto";
import { EducationProgramService, FormService } from "../../services";
import { FormNames } from "../../services/form/constants";
import { SaveEducationProgram } from "../../services/education-program/education-program.service.models";
import {
  SummaryEducationProgramDto,
  SubsetEducationProgramDto,
} from "./models/summary-education-program.dto";
import { EducationProgram, OfferingTypes } from "../../database/entities";
import { OptionItem } from "../../types";
import { credentialTypeToDisplay } from "../../utilities";
import { UserGroups } from "../../auth/user-groups.enum";

@Controller("institution/education-program")
export class EducationProgramController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly formService: FormService,
  ) {}

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get("location/:locationId/summary")
  async getSummary(
    @Param("locationId") locationId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<SummaryEducationProgramDto[]> {
    // [OfferingTypes.applicationSpecific] offerings are created during PIR, if required

    const programs = await this.programService.getSummaryForLocation(
      userToken.authorizations.institutionId,
      locationId,
      [OfferingTypes.public],
    );

    return programs.map((program) => ({
      id: program.id,
      name: program.name,
      credentialType: program.credentialType,
      credentialTypeToDisplay: credentialTypeToDisplay(program.credentialType),
      cipCode: program.cipCode,
      totalOfferings: program.totalOfferings,
      approvalStatus: program.approvalStatus,
    }));
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
    // from the client form it will be overrided by the server calculated one.
    const saveProgramPaylod: SaveEducationProgram = {
      ...submissionResult.data.data,
      programDeliveryTypes: submissionResult.data.data.programDeliveryTypes,
      institutionId: userToken.authorizations.institutionId,
      id: programId,
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
  async get(
    @Param("programId") programId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<SubsetEducationProgramDto> {
    const educationProgram = await this.programService.getLocationPrograms(
      programId,
      userToken.authorizations.institutionId,
    );
    return {
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
      approvalStatus: educationProgram.approvalStatus,
      programIntensity: educationProgram.programIntensity,
      institutionProgramCode: educationProgram.institutionProgramCode,
    };
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
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<EducationProgramDto> {
    const program = await this.programService.getInstitutionProgram(
      id,
      userToken.authorizations.institutionId,
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
    };
  }

  // /**
  //  * Education Program Details for ministry users
  //  * @param programId program id
  //  * @returns Education Program Details
  //  */
  // @AllowAuthorizedParty(AuthorizedParties.aest)
  // @Groups(UserGroups.AESTUser)
  // @Get(":programId/aest")
  // async getEducationProgramDetails(
  //   @Param("programId") programId: number,
  // ): Promise<SubsetEducationProgramDto> {
  //   const educationProgram =
  //     await this.programService.getEducationProgramDetails(programId);
  //   return {
  //     id: educationProgram.id,
  //     name: educationProgram.name,
  //     description: educationProgram.description,
  //     credentialType: educationProgram.credentialType,
  //     credentialTypeToDisplay: credentialTypeToDisplay(
  //       educationProgram.credentialType,
  //     ),
  //     cipCode: educationProgram.cipCode,
  //     nocCode: educationProgram.nocCode,
  //     sabcCode: educationProgram.sabcCode,
  //     approvalStatus: educationProgram.approvalStatus,
  //     programIntensity: educationProgram.programIntensity,
  //     institutionProgramCode: educationProgram.institutionProgramCode,
  //   };
  // }

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
  ): Promise<EducationProgramData> {
    const program = await this.programService.getEducationProgramDetails(
      programId,
    );

    if (!program) {
      throw new NotFoundException("Not able to find the requested program.");
    }

    return {
      id: program.id,
      approvalStatus: program.approvalStatus,
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
      credentialTypeToDisplay: credentialTypeToDisplay(program.credentialType),
      institutionId: program.institution.id,
    };
  }
}
