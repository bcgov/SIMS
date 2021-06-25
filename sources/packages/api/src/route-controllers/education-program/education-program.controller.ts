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
} from "../../auth/decorators";
import { EducationProgramDto } from "./models/save-education-program.dto";
import {
  EducationProgramOfferingService,
  EducationProgramService,
  FormService,
} from "../../services";
import { FormNames } from "../../services/form/constants";
import { SaveEducationProgram } from "../../services/education-program/education-program.service.models";
import {
  SummaryEducationProgramDto,
  SubsetEducationProgramDto,
} from "./models/summary-education-program.dto";
import { EducationProgram } from "../../database/entities";
import { OptionItem } from "../../types";

@Controller("institution/education-program")
export class EducationProgramController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly offeringsService: EducationProgramOfferingService,
    private readonly formService: FormService,
  ) {}

  @AllowAuthorizedParty(AuthorizedParties.institution)
  @HasLocationAccess("locationId")
  @Get("location/:locationId/summary")
  async getSummary(
    @Param("locationId") locationId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<SummaryEducationProgramDto[]> {
    const programs = await this.programService.getSummaryForLocation(
      userToken.authorizations.institutionId,
      locationId,
    );

    return programs.map((program) => ({
      id: program.id,
      name: program.name,
      credentialType: program.credentialTypeToDisplay,
      cipCode: program.cipCode,
      totalOfferings: program.totalOfferings,
      approvalStatus: program.approvalStatus,
    }));
  }

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
      credentialTypeOther: program.credentialTypeOther,
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
      averageHoursStudy: program.averageHoursStudy,
      completionYears: program.completionYears,
      admissionRequirement: program.admissionRequirement,
      hasMinimunAge: program.hasMinimunAge,
      eslEligibility: program.eslEligibility,
      hasJointInstitution: program.hasJointInstitution,
      hasJointDesignatedInstitution: program.hasJointDesignatedInstitution,
    };
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
   * This retuns only the subset of the EducationProgram to get
   * the complete EducationProgram DTO use the @Get(":id") method
   * @param programId
   * @returns
   */
  @AllowAuthorizedParty(AuthorizedParties.institution)
  @Get(":programId/summary")
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
      credentialType: educationProgram.credentialTypeToDisplay,
      cipCode: educationProgram.cipCode,
      nocCode: educationProgram.nocCode,
      sabcCode: educationProgram.sabcCode,
      approvalStatus: educationProgram.approvalStatus,
    };
  }

  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("location/:locationId/option-list")
  async getLocationProgramsOptionList(
    @Param("locationId") locationId: number,
  ): Promise<OptionItem[]> {
    const programs = await this.programService.getProgramsForLocation(
      locationId,
    );

    return programs.map((program) => ({
      id: program.id,
      description: program.name,
    }));
  }
}
