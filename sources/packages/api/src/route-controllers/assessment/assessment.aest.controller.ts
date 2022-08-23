import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import BaseController from "../BaseController";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  ApplicationExceptionService,
  ApplicationService,
  EducationProgramOfferingService,
  StudentAppealService,
  StudentAssessmentService,
  StudentScholasticStandingsService,
} from "../../services";
import {
  AssessmentHistorySummaryAPIOutDTO,
  AssessmentNOAAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
  RequestAssessmentTypeAPIOutDTO,
} from "./models/assessment.dto";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AssessmentControllerService } from "./assessment.controller.service";
import {
  ApplicationExceptionStatus,
  AssessmentTriggerType,
  OfferingStatus,
} from "../../database/entities";
import { StudentAssessmentStatus } from "../../services/student-assessment/student-assessment.models";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("assessment")
@ApiTags(`${ClientTypeBaseRoute.AEST}-assessment`)
export class AssessmentAESTController extends BaseController {
  constructor(
    private readonly studentAppealService: StudentAppealService,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly assessmentControllerService: AssessmentControllerService,
    private readonly applicationExceptionService: ApplicationExceptionService,
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
    private readonly applicationService: ApplicationService,
    private readonly educationProgramOfferingService: EducationProgramOfferingService,
  ) {
    super();
  }

  /**
   * Get all requests related to an assessments for a student
   * application, i.e, this will fetch all pending and denied
   * student appeals for an application or possible application
   * exceptions that will prevent the assessment to proceed till
   * they are approved, for instance, when a document is uploaded
   * and need to be reviewed.
   * @param applicationId application number.
   * @returns assessment requests or exceptions for a student application.
   */
  @Get("application/:applicationId/requests")
  async getRequestedAssessmentSummary(
    @Param("applicationId") applicationId: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    let requestAssessmentSummary: RequestAssessmentSummaryAPIOutDTO;
    const precedingOfferingRequest =
      await this.applicationService.getOfferingChangeRequestsByApplicationId(
        applicationId,
      );
    if (precedingOfferingRequest) {
      const changedOffering =
        await this.educationProgramOfferingService.getOfferingRequestsByPrecedingOfferingId(
          precedingOfferingRequest.currentAssessment.offering.id,
        );
      if (changedOffering) {
        requestAssessmentSummary = {
          id: changedOffering.id,
          submittedDate: changedOffering.submittedDate,
          status: OfferingStatus.ChangeAwaitingApproval,
          requestType: RequestAssessmentTypeAPIOutDTO.OfferingRequest,
          programId: changedOffering.educationProgram.id,
        };
      }
    }

    const applicationExceptions =
      await this.applicationExceptionService.getExceptionsByApplicationId(
        applicationId,
        ApplicationExceptionStatus.Pending,
        ApplicationExceptionStatus.Declined,
      );

    if (applicationExceptions.length > 0) {
      return [].concat(
        requestAssessmentSummary,
        applicationExceptions.map((applicationException) => ({
          id: applicationException.id,
          submittedDate: applicationException.createdAt,
          status: applicationException.exceptionStatus,
          requestType: RequestAssessmentTypeAPIOutDTO.StudentException,
        })),
      );
    }

    const studentAppeal =
      await this.studentAppealService.getPendingAndDeniedAppeals(applicationId);
    return [].concat(
      requestAssessmentSummary,
      studentAppeal.map((appeals) => ({
        id: appeals.id,
        submittedDate: appeals.submittedDate,
        status: appeals.status,
        requestType: RequestAssessmentTypeAPIOutDTO.StudentAppeal,
      })),
    );
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
    const [assessments, unsuccessfulScholasticStanding] = await Promise.all([
      this.studentAssessmentService.assessmentHistorySummary(applicationId),
      this.studentScholasticStandingsService.getUnsuccessfulScholasticStandings(
        applicationId,
      ),
    ]);
    const history: AssessmentHistorySummaryAPIOutDTO[] = assessments.map(
      (assessment) => ({
        assessmentId: assessment.id,
        submittedDate: assessment.submittedDate,
        triggerType: assessment.triggerType,
        assessmentDate: assessment.assessmentDate,
        status: assessment.status,
        offeringId: assessment.offering.id,
        programId: assessment.offering.educationProgram.id,
        studentAppealId: assessment.studentAppeal?.id,
        applicationExceptionId: assessment.application.applicationException?.id,
        studentScholasticStandingId: assessment.studentScholasticStanding?.id,
      }),
    );
    // Add unsuccessful scholastic standing to the top of the list, if present.
    // For unsuccessful scholastic standing, status is always "completed" and
    // "createdAt" is "submittedDate".
    if (unsuccessfulScholasticStanding) {
      history.unshift({
        submittedDate: unsuccessfulScholasticStanding.createdAt,
        triggerType: AssessmentTriggerType.ScholasticStandingChange,
        status: StudentAssessmentStatus.Completed,
        studentScholasticStandingId: unsuccessfulScholasticStanding.id,
        hasUnsuccessfulWeeks: true,
      });
    }

    return history;
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
    @Param("assessmentId") assessmentId: number,
  ): Promise<AssessmentNOAAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentNOA(assessmentId);
  }
}
