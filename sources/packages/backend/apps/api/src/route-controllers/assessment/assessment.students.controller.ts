import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import BaseController from "../BaseController";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import {
  AssessmentNOAAPIOutDTO,
  AwardDetailsAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
  AssessmentHistorySummaryAPIOutDTO,
} from "./models/assessment.dto";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AssessmentControllerService } from "./assessment.controller.service";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
  StudentAssessmentService,
} from "../../services";
import { StudentUserToken } from "../../auth/userToken.interface";
import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("assessment")
@ApiTags(`${ClientTypeBaseRoute.Student}-assessment`)
export class AssessmentStudentsController extends BaseController {
  constructor(
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly assessmentControllerService: AssessmentControllerService,
  ) {
    super();
  }

  /**
   * Get the NOA values for a student application on a particular assessment.
   * @param assessmentId assessment id to get the NOA values.
   * @returns NOA and application data.
   */
  @Get(":assessmentId/noa")
  @ApiNotFoundResponse({
    description: "Assessment id not found for the student.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Notice of assessment data is not present.",
  })
  async getAssessmentNOA(
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<AssessmentNOAAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentNOA(assessmentId, {
      studentId: userToken.studentId,
      maskMSFAA: false,
      maskTotalFamilyIncome: false,
    });
  }

  /**
   * Confirm assessment of a Student.
   * @param assessmentId assessment id to be confirmed.
   */
  @ApiNotFoundResponse({
    description: "Not able to find the assessment for the student.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Student not found or assessment confirmation failed or an assessment other than the current one may not be approved.",
  })
  @Patch(":assessmentId/confirm-assessment")
  async confirmAssessmentNOA(
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<void> {
    try {
      await this.studentAssessmentService.studentConfirmAssessment(
        assessmentId,
        userToken.studentId,
        userToken.userId,
      );
    } catch (error) {
      switch (error.name) {
        case ASSESSMENT_NOT_FOUND:
          throw new NotFoundException(error.message);
        case ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
          throw new UnprocessableEntityException(error.message);
        default:
          throw error;
      }
    }
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
    @UserToken() userToken: StudentUserToken,
  ): Promise<AwardDetailsAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentAwardDetails(
      assessmentId,
      { studentId: userToken.studentId },
    );
  }

  /**
   * Get all requests related to an application for a student sorted in descending order wrt. submitted date
   *  i.e, this will fetch all pending and denied student appeals
   * along with the pending and declined application offering change requests.
   * @param applicationId application number.
   * @returns assessment requests or exceptions for a student application.
   */
  @Get("application/:applicationId/requests")
  async getRequestedAssessmentSummary(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    const pendingAndDeniedAppealsPromise =
      this.assessmentControllerService.getPendingAndDeniedAppeals(
        applicationId,
        userToken.studentId,
      );
    const studentInProgressAndDeclinedApplicationOfferingChangeRequestsPromise =
      this.assessmentControllerService.getApplicationOfferingChangeRequestsByStatus(
        applicationId,
        [
          ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
          ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
        ],
        { studentId: userToken.studentId },
      );
    const [
      pendingAndDeniedAppeals,
      studentInProgressAndDeclinedApplicationOfferingChangeRequests,
    ] = await Promise.all([
      pendingAndDeniedAppealsPromise,
      studentInProgressAndDeclinedApplicationOfferingChangeRequestsPromise,
    ]);
    return [
      ...pendingAndDeniedAppeals,
      ...studentInProgressAndDeclinedApplicationOfferingChangeRequests,
    ].sort(this.assessmentControllerService.sortAssessmentHistory);
  }

  /**
   * Get history of approved assessments for an application.
   * @param applicationId, application number.
   * @returns summary of the assessment history for a student application.
   */
  @Get("application/:applicationId/history")
  async getAssessmentHistorySummary(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: StudentUserToken,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    return this.assessmentControllerService.getAssessmentHistorySummary(
      applicationId,
      userToken.studentId,
    );
  }
}
