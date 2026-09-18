import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import BaseController from "../BaseController";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  AssessmentHistorySummaryAPIOutDTO,
  AssessmentNOAAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
  AwardDetailsAPIOutDTO,
  BatchSubmissionResultAPIOutDTO,
  BatchSubmissionResultStatus,
} from "./models/assessment.dto";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AssessmentControllerService } from "./assessment.controller.service";
import {
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "@sims/services/constants";
import { ApplicationStatus, StudentAssessmentStatus } from "@sims/sims-db";
import { CustomNamedError } from "@sims/utilities";
import { Role, IUserToken } from "../../auth";
import {
  ManualReassessmentAPIInDTO,
  BatchReassessmentAPIInDTO,
} from "../assessment/models/assessment.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { StudentAssessmentService } from "../../services";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("assessment")
@ApiTags(`${ClientTypeBaseRoute.AEST}-assessment`)
export class AssessmentAESTController extends BaseController {
  constructor(
    private readonly assessmentControllerService: AssessmentControllerService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    super();
  }

  /**
   * Get all pending and declined requests related to an application which would result
   * a new assessment when that request is approved.
   * @param applicationId application id.
   * @returns assessment requests or exceptions for a student application.
   */
  @Get("application/:applicationId/requests")
  async getRequestedAssessmentSummary(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    return this.assessmentControllerService.requestedStudentAssessmentSummary(
      applicationId,
      {
        includeOfferingChanges: true,
      },
    );
  }

  /**
   * Gets the history of batch manual reassessment submissions.
   * @returns batch manual reassessment history.
   */
  @Roles(Role.AESTBatchReassessment)
  @Get("application/batch-reassessment/history")
  async getBatchReassessmentHistory(): Promise<
    BatchSubmissionResultAPIOutDTO[]
  > {
    return this.getDummyBatchReassessmentHistory();
  }

  /**
   * Method to get history of assessments for an application,
   * i.e, this will have original assessment for the
   * student application, and all approved student
   * appeal and scholastic standings for the application
   * which will have different assessment status.
   * @param applicationId, application number.
   * @returns summary of the assessment history for a student application.
   */
  @Get("application/:applicationId/history")
  async getAssessmentHistorySummary(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    return this.assessmentControllerService.getAssessmentHistorySummary(
      applicationId,
    );
  }

  /**
   * Get the NOA values for a student application on a particular assessment.
   * @param assessmentId assessment id to get the NOA values.
   * @returns NOA and application data.
   */
  @Get(":assessmentId/noa")
  @ApiNotFoundResponse({
    description: "Assessment id not found.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Notice of assessment data is not present.",
  })
  async getAssessmentNOA(
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
  ): Promise<AssessmentNOAAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentNOA(assessmentId, {
      maskMSFAA: false,
      maskTotalFamilyIncome: false,
    });
  }

  /**
   * Get estimated and actual(if present) award details of an assessment.
   * @param assessmentId assessment to which awards details belong to.
   * @returns estimated and actual award details.
   */
  @Get(":assessmentId/award")
  @ApiNotFoundResponse({
    description: "Assessment not found.",
  })
  async getAssessmentAwardDetails(
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
  ): Promise<AwardDetailsAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentAwardDetails(
      assessmentId,
      { includeDateSent: true, includeDocumentNumber: true, maskMSFAA: false },
    );
  }

  /**
   * Triggers manual reassessment for an application.
   * Application cannot be archived or in any of the statuses 'Cancelled', 'Edited' or 'Draft' and original assessment must be in completed status.
   * @param payload request payload.
   * @param applicationId application id.
   * @returns id of the assessment created.
   */
  @Roles(Role.AESTManualTriggerReassessment)
  @Post("application/:applicationId/manual-reassessment")
  @ApiNotFoundResponse({ description: "Application id not found." })
  @ApiUnprocessableEntityResponse({
    description:
      `Application original assessment expected to be '${StudentAssessmentStatus.Completed}' to allow manual reassessment or ` +
      "application cannot have manual reassessment after being archived or " +
      `application cannot have manual reassessment in any of the statuses: ${ApplicationStatus.Cancelled}, ${ApplicationStatus.Edited} or ${ApplicationStatus.Draft}.`,
  })
  async manualReassessment(
    @Body() payload: ManualReassessmentAPIInDTO,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const manualAssessment =
        await this.studentAssessmentService.createManualReassessment(
          applicationId,
          payload.note,
          userToken.userId,
        );
      return { id: manualAssessment.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        if (error.name === APPLICATION_NOT_FOUND) {
          throw new NotFoundException(error.message);
        }
        if (error.name === INVALID_OPERATION_IN_THE_CURRENT_STATUS) {
          throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Triggers a batch manual reassessment for a list of application numbers.
   * This is a stub implementation and does not yet perform any processing.
   * @param payload request payload.
   * @returns void.
   */
  @Roles(Role.AESTBatchReassessment)
  @Post("application/batch-reassessment")
  async batchReassessment(
    @Body() payload: BatchReassessmentAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    await this.studentAssessmentService.performBatchManualReassessment(
      payload.applicationNumbers,
      payload.note,
      userToken.userId,
    );
  }

  /**
   * Gets the history of batch manual reassessment submissions.
   * This is a stub implementation returning dummy data until the batch
   * processing and its persistence are implemented.
   * @returns batch manual reassessment history.
   *
   */
  // TODO Remove this code
  async getDummyBatchReassessmentHistory(): Promise<
    BatchSubmissionResultAPIOutDTO[]
  > {
    return [
      {
        batchId: 1003,
        submittedDate: new Date("2026-09-17T14:32:00"),
        submittedBy: "John Smith",
        totalApplications: 25,
        successfulApplications: 25,
        failedApplications: 0,
        status: BatchSubmissionResultStatus.Completed,
      },
      {
        batchId: 1002,
        submittedDate: new Date("2026-09-16T09:10:00"),
        submittedBy: "Jane Doe",
        totalApplications: 40,
        successfulApplications: 36,
        failedApplications: 4,
        status: BatchSubmissionResultStatus.Completed,
      },
      {
        batchId: 1001,
        submittedDate: new Date("2026-09-15T16:45:00"),
        submittedBy: "John Smith",
        totalApplications: 12,
        successfulApplications: 0,
        failedApplications: 0,
        status: BatchSubmissionResultStatus.InProgress,
      },
    ];
  }
}
