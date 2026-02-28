import { Controller, Get, Query } from "@nestjs/common";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import { FormSubmissionPendingSummaryAPIOutDTO } from "./models/form-submission.dto";
import {
  FormSubmissionPendingPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import { FormSubmissionService } from "../../services";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("form-submission")
@ApiTags(`${ClientTypeBaseRoute.AEST}-form-submission`)
export class FormSubmissionAESTController extends BaseController {
  constructor(private readonly formSubmissionService: FormSubmissionService) {
    super();
  }

  /**
   * Gets all pending student form submissions for ministry review.
   * Only form submissions with category StudentForm and status Pending are returned.
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
        formName: submission.formName,
      })),
      count: pendingSubmissions.count,
    };
  }
}
