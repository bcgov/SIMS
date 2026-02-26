import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  FORM_SUBMISSION_ITEM_NOT_FOUND,
  FORM_SUBMISSION_ITEM_OUTDATED,
  FORM_SUBMISSION_NOT_FOUND,
  FORM_SUBMISSION_UPDATE_UNAUTHORIZED,
  FormSubmissionApprovalService,
} from "../../services";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties, IUserToken, Role, UserGroups } from "../../auth";
import {
  FormSubmissionCompletionAPIInDTO,
  FormSubmissionItemDecisionAPIInDTO,
  FormSubmissionMinistryAPIOutDTO,
} from "./models/form-submission.dto";
import { getUserFullName } from "../../utilities";
import { FormSubmissionDecisionStatus } from "@sims/sims-db/entities/form-submission-decision-status.type";
import { CustomNamedError } from "@sims/utilities";

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
   * @param itemId optional ID of the form submission item to filter the details for.
   * @returns form submission details including individual form items and their details.
   */
  @ApiNotFoundResponse({ description: "Form submission not found" })
  @Get(":formSubmissionId")
  async getFormSubmission(
    @UserToken() userToken: IUserToken,
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
    @Query("itemId", new ParseIntPipe({ optional: true })) itemId?: number,
  ): Promise<FormSubmissionMinistryAPIOutDTO> {
    const submission =
      await this.formSubmissionApprovalService.getFormSubmissionsById(
        formSubmissionId,
        { itemId },
      );
    if (!submission) {
      throw new NotFoundException(
        `Form submission with ID ${formSubmissionId} not found.`,
      );
    }
    const hasApprovalAuthorization =
      this.formSubmissionApprovalService.hasApprovalAuthorization(
        submission.formCategory,
        userToken.roles,
      );
    return {
      hasApprovalAuthorization,
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
        dynamicFormConfigurationId: item.dynamicFormConfiguration.id,
        submissionData: item.submittedData,
        formDefinitionName: item.dynamicFormConfiguration.formDefinitionName,
        decisionStatus:
          item.currentDecision?.decisionStatus ??
          FormSubmissionDecisionStatus.Pending,
        updatedAt: item.updatedAt,
        currentDecision:
          hasApprovalAuthorization && item.currentDecision
            ? {
                id: item.currentDecision.id,
                decisionStatus: item.currentDecision.decisionStatus,
                decisionDate: item.currentDecision.decisionDate,
                decisionBy: getUserFullName(item.currentDecision.decisionBy),
                decisionNoteDescription:
                  item.currentDecision.decisionNote?.description,
              }
            : undefined,
        decisions: hasApprovalAuthorization
          ? item.decisions
              .filter((decision) => decision.id !== item.currentDecision?.id)
              .map((decision) => ({
                id: decision.id,
                decisionStatus: decision.decisionStatus,
                decisionDate: decision.decisionDate,
                decisionBy: getUserFullName(decision.decisionBy),
                decisionNoteDescription: decision.decisionNote?.description,
              }))
          : undefined,
      })),
    };
  }

  /**
   * Updates an individual form item in the form submission with the decision made by the Ministry, including the decision status and note.
   * @param formSubmissionItemId ID of the form submission item to update the decision for.
   * @param payload decision status and note description for the form submission item.
   */
  @ApiNotFoundResponse({ description: "Form submission item not found." })
  @ApiForbiddenResponse({
    description: "User is not authorized to make decision on the form item.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "The form submission item has been updated since it was last retrieved or " +
      "decisions cannot be made on items belonging to a form submission that is not pending.",
  })
  @Roles(Role.StudentApproveDeclineAppeals, Role.StudentApproveDeclineForms)
  @Patch("items/:formSubmissionItemId/decision")
  async submitItemDecision(
    @Param("formSubmissionItemId", ParseIntPipe) formSubmissionItemId: number,
    @Body() payload: FormSubmissionItemDecisionAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.formSubmissionApprovalService.saveFormSubmissionItem(
        formSubmissionItemId,
        payload.decisionStatus,
        payload.noteDescription,
        payload.lastUpdateDate,
        userToken.roles,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case FORM_SUBMISSION_ITEM_NOT_FOUND:
            throw new NotFoundException(error.message);
          case FORM_SUBMISSION_ITEM_OUTDATED:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          case FORM_SUBMISSION_UPDATE_UNAUTHORIZED:
            throw new ForbiddenException(error.message);
          default:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Updates the form submission status to completed when all the related form items have been decided,
   * and executes the related business logic such as sending notification.
   * This is the final step of the form submission approval process for the Ministry, which indicates that
   * all decisions on the form items have been made and the form submission is completed.
   * @param formSubmissionId ID of the form submission to be completed.
   */
  @ApiNotFoundResponse({ description: "Form submission not found." })
  @ApiForbiddenResponse({
    description: "User is not authorized to complete the form submission.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Final decision cannot be made on a form submission with status different than pending or " +
      "the provided form submission items do not match the form submission items for this submission or " +
      "form submission item not found in the form submission or " +
      "form submission item has been updated since it was last retrieved or " +
      "final decision cannot be made when some decisions are still pending.",
  })
  @Roles(Role.StudentApproveDeclineAppeals, Role.StudentApproveDeclineForms)
  @Patch(":formSubmissionId/complete")
  async completeFormSubmission(
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
    @UserToken() userToken: IUserToken,
    @Body() payload: FormSubmissionCompletionAPIInDTO,
  ): Promise<void> {
    try {
      await this.formSubmissionApprovalService.completeFormSubmission(
        formSubmissionId,
        payload.items,
        userToken.roles,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case FORM_SUBMISSION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case FORM_SUBMISSION_ITEM_OUTDATED:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          case FORM_SUBMISSION_UPDATE_UNAUTHORIZED:
            throw new ForbiddenException(error.message);
          default:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }
}
