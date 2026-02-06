import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Put,
} from "@nestjs/common";
import { FormSubmissionService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { IUserToken, UserGroups } from "apps/api/src/auth";
import {
  FormSubmissionItemDecisionAPIInDTO,
  FormSubmissionMinistryAPIOutDTO,
} from "./models/form-submission.dto";
import { PrimaryIdentifierAPIOutDTO } from "apps/api/src/route-controllers/models/primary.identifier.dto";

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
        id: item.id,
        formType: item.dynamicFormConfiguration.formType,
        formCategory: item.dynamicFormConfiguration.formCategory,
        decisionStatus: item.decisionStatus,
        decisionDate: item.decisionDate,
        decisionNoteDescription: item.decisionNote?.description,
        dynamicFormConfigurationId: item.dynamicFormConfiguration.id,
        submissionData: item.submittedData,
        formDefinitionName: item.dynamicFormConfiguration.formDefinitionName,
      })),
    };
  }

  @Put("items/:formSubmissionItemId/decision")
  async submitItemDecision(
    @Param("formSubmissionItemId", ParseIntPipe) formSubmissionItemId: number,
    @Body() payload: FormSubmissionItemDecisionAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const updatedItem = await this.formSubmissionService.saveFormSubmissionItem(
      formSubmissionItemId,
      payload.decisionStatus,
      payload.noteDescription,
      userToken.userId,
    );
    return { id: updatedItem.id };
  }

  @Patch(":formSubmissionId/complete")
  async completeFormSubmission(
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.formSubmissionService.completeFormSubmission(
      formSubmissionId,
      userToken.userId,
    );
  }
}
