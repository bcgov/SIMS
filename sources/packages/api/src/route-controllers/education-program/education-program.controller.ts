import {
  Body,
  Controller,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import { IInstitutionUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { CreateEducationProgramDto } from "./models/create-education-program.dto";
import { EducationProgramService, FormService } from "../../services";
import { FormNames } from "../../services/form/constants";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/education-program")
export class EducationProgramController {
  constructor(
    private readonly programService: EducationProgramService,
    private readonly formService: FormService,
  ) {}

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

    const createdProgram = await this.programService.createEducationProgram(
      userToken.authorizations.institutionId,
      payload,
    );
    return createdProgram.id;
  }
}
