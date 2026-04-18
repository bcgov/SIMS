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
  FormSubmissionService,
} from "../../services";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties, IUserToken, UserGroups } from "../../auth";
import {
  FormSubmissionCompletionAPIInDTO,
  FormSubmissionItemDecisionAPIInDTO,
  FormSubmissionMinistryAPIOutDTO,
  FormSubmissionPendingSummaryAPIOutDTO,
  FormSubmissionsAPIOutDTO,
} from "./models/form-submission.dto";
import { CustomNamedError } from "@sims/utilities";
import {
  FormSubmissionPendingPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import { FormSubmissionControllerService } from "./form-submission.controller.service";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("form-submission")
@ApiTags(`${ClientTypeBaseRoute.AEST}-form-submission`)
export class FormSubmissionAESTController extends BaseController {
  constructor(
    private readonly formSubmissionApprovalService: FormSubmissionApprovalService,
    private readonly formSubmissionService: FormSubmissionService,
    private readonly formSubmissionControllerService: FormSubmissionControllerService,
  ) {
    super();
  }

  /**
   * Gets all pending student form submissions for ministry review across all form categories.
   * Only form submissions with status Pending are returned.
   * @param pagination pagination options to control page size, sorting, and optional search.
   * @returns paginated list of pending form submissions awaiting ministry review.
   */
  @Get("pending")
  async getPendingFormSubmissions(
    @Query() pagination: FormSubmissionPendingPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<FormSubmissionPendingSummaryAPIOutDTO>> {
    const pendingSubmissions =
      await this.formSubmissionService.getPendingFormSubmissions(pagination);
    return {
      results: pendingSubmissions.results.map((submission) => ({
        formSubmissionId: submission.formSubmissionId,
        studentId: submission.studentId,
        submittedDate: submission.submittedDate,
        firstName: submission.firstName,
        lastName: submission.lastName,
        formNames: submission.formNames,
        applicationId: submission.applicationId,
        applicationNumber: submission.applicationNumber,
      })),
      count: pendingSubmissions.count,
    };
  }

  /**
   * Gets the list of form submissions for a student,
   * including the individual form items and their details.
   * @param studentId student ID to retrieve the form submission history for.
   * @returns list of form submissions for a student.
   */
  @Get("student/:studentId")
  async getFormSubmissionHistory(
    @UserToken() userToken: IUserToken,
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<FormSubmissionsAPIOutDTO> {
    const submissions =
      await this.formSubmissionControllerService.getFormSubmissions(studentId, {
        userRoles: userToken.roles,
      });
    return {
      submissions,
    };
  }

  /**
   * Get the details of a form submission, including the individual form items and their details.
   * @param formSubmissionId ID of the form submission to retrieve the details for.
   * @param itemId optional ID of the form submission item to filter the details for.
   * Useful only when a single item detail is required.
   * @returns form submission details including individual form items and their details.
   */
  @ApiNotFoundResponse({ description: "Form submission not found" })
  @Get(":formSubmissionId")
  async getFormSubmission(
    @UserToken() userToken: IUserToken,
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
    @Query("itemId", new ParseIntPipe({ optional: true })) itemId?: number,
  ): Promise<FormSubmissionMinistryAPIOutDTO> {
    return this.formSubmissionControllerService.getFormSubmission(
      formSubmissionId,
      userToken.roles,
      itemId,
    );
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
      "decisions cannot be made on items belonging to a form submission that is not pending or " +
      "the application associated with the form submission is not in the expected status..",
  })
  @Patch("items/:formSubmissionItemId/decision")
  async submitItemDecision(
    @Param("formSubmissionItemId", ParseIntPipe) formSubmissionItemId: number,
    @Body() payload: FormSubmissionItemDecisionAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.formSubmissionApprovalService.saveFormSubmissionItem(
        formSubmissionItemId,
        payload,
        userToken.roles,
        userToken.userId!,
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
      "the provided form submission items do not match the form submission items currently saved for this submission or " +
      "form submission item not found in the form submission or " +
      "form submission item has been updated since it was last retrieved or " +
      "final decision cannot be made when some decisions are still pending or " +
      "the application associated with the form submission is not in the expected status.",
  })
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
