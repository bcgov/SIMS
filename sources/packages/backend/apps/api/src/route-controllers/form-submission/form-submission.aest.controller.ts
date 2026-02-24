import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  FORM_SUBMISSION_ITEM_OUTDATED,
  FORM_SUBMISSION_UPDATE_UNAUTHORIZED,
  FormSubmissionApprovalService,
} from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import {
  extractRolesFromToken,
  IUserToken,
  Role,
  UserGroups,
} from "apps/api/src/auth";
import {
  FormSubmissionItemDecisionAPIInDTO,
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
   * @param itemId optional ID of the form submission item to filter the details for.
   * @returns form submission details including individual form items and their details.
   */
  @Get(":formSubmissionId")
  async getFormSubmission(
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
    @Query("itemId", new ParseIntPipe({ optional: true })) itemId?: number,
  ): Promise<FormSubmissionMinistryAPIOutDTO> {
    const submission =
      await this.formSubmissionApprovalService.getFormSubmissionsById(
        formSubmissionId,
        { itemId },
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
        updatedAt: item.updatedAt,
      })),
    };
  }

  /**
   * Updates an individual form item in the form submission with the decision made by the Ministry, including the decision status and note.
   * @param formSubmissionItemId ID of the form submission item to update the decision for.
   * @param payload decision status and note description for the form submission item.
   * @param userToken user token containing the user ID of the Ministry user making the decision, used for auditing purposes.
   */
  @Roles(Role.StudentApproveDeclineAppeals, Role.StudentApproveDeclineForms)
  @Patch("items/:formSubmissionItemId/decision")
  async submitItemDecision(
    @Param("formSubmissionItemId", ParseIntPipe) formSubmissionItemId: number,
    @Body() payload: FormSubmissionItemDecisionAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      const userRoles = extractRolesFromToken(userToken);
      await this.formSubmissionApprovalService.saveFormSubmissionItem(
        formSubmissionItemId,
        payload.decisionStatus,
        payload.noteDescription,
        payload.lastUpdateDate,
        userRoles,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === FORM_SUBMISSION_ITEM_OUTDATED
      ) {
        throw new UnprocessableEntityException(
          new ApiProcessError(error.message, error.name),
        );
      } else if (
        error instanceof Error &&
        error.name === FORM_SUBMISSION_UPDATE_UNAUTHORIZED
      ) {
        throw new UnauthorizedException(error.message);
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
  @Roles(Role.StudentApproveDeclineAppeals, Role.StudentApproveDeclineForms)
  @Patch(":formSubmissionId/complete")
  async completeFormSubmission(
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      const userRoles = extractRolesFromToken(userToken);
      await this.formSubmissionApprovalService.completeFormSubmission(
        formSubmissionId,
        userRoles,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.name === FORM_SUBMISSION_UPDATE_UNAUTHORIZED
      ) {
        throw new UnauthorizedException(error.message);
      }
      throw error;
    }
  }
}
