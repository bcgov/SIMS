import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from "@nestjs/common";
import { FormSubmissionApprovalService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { IUserToken, UserGroups } from "apps/api/src/auth";
import {
  FormSubmissionItemDecisionAPIInDTO,
  FormSubmissionItemDecisionAPIOutDTO,
  FormSubmissionMinistryAPIOutDTO,
} from "./models/form-submission.dto";
import { getUserFullName } from "apps/api/src/utilities";

// TODO: add roles
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("form-submission")
@ApiTags(`${ClientTypeBaseRoute.AEST}-form-submission`)
export class FormSubmissionAESTController extends BaseController {
  constructor(
    private readonly formSubmissionApprovalService: FormSubmissionApprovalService,
  ) {
    super();
  }

  /**
   * Get the details of a form submission, including the individual form items and their details.
   * For the ministry, it is using during the approval process, providing the necessary details for
   * the decision making on each form item.
   * For the student, it is used to show the details of their submission, including the decision made
   * on each form item.
   * @param formSubmissionId ID of the form submission to retrieve the details for.
   * @returns form submission details including individual form items and their details.
   */
  @Get(":formSubmissionId")
  async getFormSubmission(
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
  ): Promise<FormSubmissionMinistryAPIOutDTO> {
    const submission =
      await this.formSubmissionApprovalService.getFormSubmissionsById(
        formSubmissionId,
      );
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
        decisionBy: getUserFullName(item.decisionBy),
        dynamicFormConfigurationId: item.dynamicFormConfiguration.id,
        submissionData: item.submittedData,
        formDefinitionName: item.dynamicFormConfiguration.formDefinitionName,
      })),
    };
  }

  /**
   * Updates an individual form item in the form submission with the decision made by the Ministry, including the decision status and note.
   * @param formSubmissionItemId ID of the form submission item to update the decision for.
   * @param payload decision status and note description for the form submission item.
   * @param userToken user token containing the user ID of the Ministry user making the decision, used for auditing purposes.
   */
  @Patch("items/:formSubmissionItemId/decision")
  async submitItemDecision(
    @Param("formSubmissionItemId", ParseIntPipe) formSubmissionItemId: number,
    @Body() payload: FormSubmissionItemDecisionAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<FormSubmissionItemDecisionAPIOutDTO> {
    const updatedItem =
      await this.formSubmissionApprovalService.saveFormSubmissionItem(
        formSubmissionItemId,
        payload.decisionStatus,
        payload.noteDescription,
        payload.lastUpdatedDate,
        userToken.userId,
      );
    return {
      decisionBy: getUserFullName(updatedItem.decisionBy),
      decisionDate: updatedItem.decisionDate,
    };
  }

  /**
   * Updates the form submission status to completed when all the related form items have been decided,
   * and executes the related business logic such as sending notification.
   * This is the final step of the form submission approval process for the Ministry, which indicates that
   * all decisions on the form items have been made and the form submission is completed.
   * @param formSubmissionId ID of the form submission to be completed.
   */
  @Patch(":formSubmissionId/complete")
  async completeFormSubmission(
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    await this.formSubmissionApprovalService.completeFormSubmission(
      formSubmissionId,
      userToken.userId,
    );
  }
}
