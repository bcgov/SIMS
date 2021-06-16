import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import { CreateEducationProgramDto } from "./models/create-education-program.dto";
import { EducationProgramService, FormService } from "../../services";
import { FormNames } from "../../services/form/constants";
import { CreateEducationProgram } from "../../services/education-program/education-program.service.models";
import {
  SummaryEducationProgramDto,
  EducationProgramDto,
} from "./models/summary-education-program.dto";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/education-program")
export class EducationProgramController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly formService: FormService,
  ) {}

  @HasLocationAccess("locationId")
  @Get("location/:locationId/summary")
  async getAll(
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

  @Get(":programId")
  async get(
    @Param("programId") programId: number,
  ): Promise<EducationProgramDto> {
    const educationProgram = await this.programService.getLocationPrograms(
      programId,
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

  @Post()
  async create(
    @Body() payload: CreateEducationProgramDto,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<number> {
    const submissionResult = await this.formService.dryRunSubmission(
      FormNames.Educationprogram,
      payload,
    );

    if (!submissionResult.valid) {
      throw new UnprocessableEntityException(
        "Not able to a create a program due to an invalid request.",
      );
    }

    // The payload returned from form.io contains the approvalStatus as
    // a calculated server value. If the approvalStatus value is sent
    // from the client form it will be overrided by the server calculated one.
    const createProgramPaylod: CreateEducationProgram = {
      ...submissionResult.data.data,
      programDeliveryTypes: submissionResult.data.data.programDeliveryTypes,
      institutionId: userToken.authorizations.institutionId,
    };
    const createdProgram = await this.programService.createEducationProgram(
      createProgramPaylod,
    );
    return createdProgram.id;
  }
}
