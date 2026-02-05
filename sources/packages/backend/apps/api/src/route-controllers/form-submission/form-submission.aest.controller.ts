import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { FormSubmissionService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "apps/api/src/auth";
import { FormSubmissionMinistryAPIOutDTO } from "./models/form-submission.dto";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("form-submission")
@ApiTags(`${ClientTypeBaseRoute.AEST}-form-submission`)
export class FormSubmissionAESTController extends BaseController {
  constructor(private readonly formSubmissionService: FormSubmissionService) {
    super();
  }

  @Get(":formSubmissionId")
  async getFormSubmission(
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
  ): Promise<FormSubmissionMinistryAPIOutDTO> {
    const submission =
      await this.formSubmissionService.getFormSubmissionsById(formSubmissionId);
    return {
      id: submission.id,
      formCategory: submission.formCategory,
      status: submission.submissionStatus,
      applicationId: submission.application?.id,
      applicationNumber: submission.application?.applicationNumber,
      assessedDate: submission.assessedDate,
      submittedDate: submission.submittedDate,
      submissionItems: submission.formSubmissionItems.map((item) => ({
        formType: item.dynamicFormConfiguration.formType,
        formCategory: item.dynamicFormConfiguration.formCategory,
        decisionStatus: item.decisionStatus,
        decisionDate: item.decisionDate,
        dynamicFormConfigurationId: item.dynamicFormConfiguration.id,
        submissionData: item.submittedData,
        formDefinitionName: item.dynamicFormConfiguration.formDefinitionName,
      })),
    };
  }

  // @Put(":formSubmissionId/items")
  // async submitItemDecision(
  //   @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
  //   @Body() payload: FormSubmissionItemDecisionAPIInDTO,
  //   @UserToken() userToken: IUserToken,
  // ): Promise<PrimaryIdentifierAPIOutDTO> {
  //   return null;
  // }

  // @Patch(":formSubmissionId")
  // async submitFinalDecision(
  //   @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
  //   @Body() payload: FormSubmissionFinalDecisionAPIInDTO,
  //   @UserToken() userToken: IUserToken,
  // ): Promise<PrimaryIdentifierAPIOutDTO> {
  //   return null;
  // }
}
