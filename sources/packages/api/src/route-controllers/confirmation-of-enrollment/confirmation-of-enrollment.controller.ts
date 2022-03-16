import {
  Controller,
  Param,
  Get,
  Post,
  Patch,
  NotFoundException,
  UnprocessableEntityException,
  Body,
  Query,
} from "@nestjs/common";
import {
  HasLocationAccess,
  AllowAuthorizedParty,
  UserToken,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { IUserToken } from "../../auth/userToken.interface";
import {
  ApplicationService,
  APPLICATION_NOT_FOUND,
  WorkflowActionsService,
  COEDeniedReasonService,
  DisbursementScheduleService,
  StudentAssessmentService,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
} from "../../services";
import {
  ApplicationStatus,
  DisbursementSchedule,
  COEStatus,
} from "../../database/entities";
import { COESummaryDTO } from "../application/models/application.model";
import { getUserFullName } from "../../utilities/auth-utils";
import {
  dateString,
  COE_WINDOW,
  getCOEDeniedReason,
  COE_DENIED_REASON_OTHER_ID,
  getExtendedDateFormat,
  PaginationParams,
  PaginationOptions,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  FieldSortOrder,
  PaginatedResults,
  getISODateOnlyString,
} from "../../utilities";
import {
  ApplicationDetailsForCOEDTO,
  DenyConfirmationOfEnrollmentDto,
  COEDeniedReasonDto,
} from "../confirmation-of-enrollment/models/confirmation-of-enrollment.model";
import { EnrollmentPeriod } from "../../services/disbursement-schedule-service/disbursement-schedule.models";
import { ApiProcessError } from "../../types";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";

const COE_NOT_FOUND_MESSAGE =
  "Confirmation of enrollment not found or application status not valid.";
const FIRST_COE_NOT_COMPLETE = "FIRST_COE_NOT_COMPLETE";
const FIRST_COE_NOT_COMPLETE_MESSAGE =
  "First disbursement(COE) not complete. Please complete the first disbursement.";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("institution/location")
@ApiTags("institution")
export class ConfirmationOfEnrollmentController extends BaseController {
  constructor(
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly applicationService: ApplicationService,
    private readonly workflow: WorkflowActionsService,
    private readonly deniedCOEReasonService: COEDeniedReasonService,
    private readonly assessmentService: StudentAssessmentService,
  ) {
    super();
  }

  /**
   * Get all Confirmation Of Enrollment(COE) of a location in an institution
   * This API is paginated with COE Status as default sort.
   * @param locationId
   * @param enrollmentPeriod
   * @param searchCriteria Search text to search COE.
   * @param sortField Field to sort COE.
   * @param page Current page of paginated result.
   * @param pageLimit Records per page in a paginated result.
   * @param sortOrder sort order of COE.
   * @returns COE Paginated Result.
   */
  @HasLocationAccess("locationId")
  @Get(
    ":locationId/confirmation-of-enrollment/enrollmentPeriod/:enrollmentPeriod",
  )
  async getCOESummary(
    @Param("locationId") locationId: number,
    @Param("enrollmentPeriod") enrollmentPeriod: EnrollmentPeriod,
    @Query(PaginationParams.SearchCriteria) searchCriteria: string,
    @Query(PaginationParams.SortField) sortField: string,
    @Query(PaginationParams.Page) page = DEFAULT_PAGE_NUMBER,
    @Query(PaginationParams.PageLimit) pageLimit = DEFAULT_PAGE_LIMIT,
    @Query(PaginationParams.SortOrder) sortOrder = FieldSortOrder.ASC,
  ): Promise<PaginatedResults<COESummaryDTO>> {
    if (!Object.values(EnrollmentPeriod).includes(enrollmentPeriod)) {
      throw new NotFoundException("Invalid enrollment period value.");
    }
    const paginationOptions = {
      page: page,
      pageLimit: pageLimit,
      sortField: sortField,
      sortOrder: sortOrder,
      searchCriteria: searchCriteria,
    } as PaginationOptions;
    const disbursementPaginatedResult =
      await this.disbursementScheduleService.getCOEByLocation(
        locationId,
        enrollmentPeriod,
        paginationOptions,
      );
    return {
      results: disbursementPaginatedResult.results.map(
        (disbursement: DisbursementSchedule) => {
          return {
            applicationNumber: disbursement.application.applicationNumber,
            applicationId: disbursement.application.id,
            studyStartPeriod: disbursement.application.offering.studyStartDate,
            studyEndPeriod: disbursement.application.offering.studyEndDate,
            coeStatus: disbursement.coeStatus,
            fullName: getUserFullName(disbursement.application.student.user),
            disbursementScheduleId: disbursement.id,
            disbursementDate: getISODateOnlyString(
              disbursement.disbursementDate,
            ),
          };
        },
      ) as COESummaryDTO[],
      count: disbursementPaginatedResult.count,
    };
  }

  /**
   * Creates a new Student Application to maintain history,
   * overriding the current one in order to rollback the
   * process and start the assessment all over again.
   * @param locationId location id executing the COE rollback.
   * @param applicationId application to be rolled back.
   * @returns the id of the newly created Student Application.
   */
  @HasLocationAccess("locationId")
  @Post(
    ":locationId/confirmation-of-enrollment/application/:applicationId/rollback",
  )
  async startCOERollback(
    @UserToken() userToken: IUserToken,
    @Param("locationId") locationId: number,
    @Param("applicationId") applicationId: number,
  ): Promise<number> {
    try {
      /** Validation to check if the application is in Enrollment status and first coe is in Required status.
       * Otherwise the application is not eligible for COE override  */
      const firstCOEofApplication =
        await this.disbursementScheduleService.getFirstCOEOfApplication(
          applicationId,
        );
      if (
        !firstCOEofApplication ||
        !(
          firstCOEofApplication.application.applicationStatus ===
            ApplicationStatus.enrollment &&
          firstCOEofApplication.coeStatus === COEStatus.required
        )
      ) {
        throw new UnprocessableEntityException(
          `Student Application is not in the expected status. The application must be in application status '${ApplicationStatus.enrollment}' and COE status '${COEStatus.required}' to be override.`,
        );
      }
      const result = await this.applicationService.overrideApplicationForCOE(
        locationId,
        applicationId,
        userToken.userId,
      );

      if (result.overriddenApplication.assessmentWorkflowId) {
        await this.workflow.deleteApplicationAssessment(
          result.overriddenApplication.assessmentWorkflowId,
        );
      }

      await this.assessmentService.startAssessment(result.createdAssessment.id);

      return result.createdApplication.id;
    } catch (error) {
      switch (error.name) {
        case APPLICATION_NOT_FOUND:
          throw new NotFoundException(error.message);
        case ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
          throw new UnprocessableEntityException(error.message);
        default:
          throw error;
      }
    }
  }

  /**
   * Get the application details for Confirmation Of Enrollment(COE)
   * @param locationId location id
   * @param disbursementScheduleId disbursement schedule id of COE
   * @returns application details for COE
   */
  @HasLocationAccess("locationId")
  @Get(
    ":locationId/confirmation-of-enrollment/disbursement/:disbursementScheduleId",
  )
  async getApplicationForCOE(
    @Param("locationId") locationId: number,
    @Param("disbursementScheduleId") disbursementScheduleId: number,
  ): Promise<ApplicationDetailsForCOEDTO> {
    const disbursementSchedule =
      await this.disbursementScheduleService.getDisbursementAndApplicationDetails(
        locationId,
        disbursementScheduleId,
      );

    if (!disbursementSchedule) {
      throw new NotFoundException(COE_NOT_FOUND_MESSAGE);
    }

    return {
      applicationProgramName:
        disbursementSchedule.application.offering.educationProgram.name,
      applicationProgramDescription:
        disbursementSchedule.application.offering.educationProgram.description,
      applicationOfferingName: disbursementSchedule.application.offering.name,
      applicationOfferingIntensity:
        disbursementSchedule.application.offering.offeringIntensity,
      applicationOfferingStartDate: dateString(
        disbursementSchedule.application.offering.studyStartDate,
      ),
      applicationOfferingEndDate: dateString(
        disbursementSchedule.application.offering.studyEndDate,
      ),
      applicationOfferingHasStudyBreak:
        disbursementSchedule.application.offering.lacksStudyBreaks,
      applicationOfferingActualTuition:
        disbursementSchedule.application.offering.actualTuitionCosts,
      applicationOfferingProgramRelatedCost:
        disbursementSchedule.application.offering.programRelatedCosts,
      applicationOfferingMandatoryCost:
        disbursementSchedule.application.offering.mandatoryFees,
      applicationOfferingExceptionalExpenses:
        disbursementSchedule.application.offering.exceptionalExpenses,
      applicationOfferingHasTuitionRemittanceRequested:
        disbursementSchedule.application.offering.tuitionRemittanceRequested,
      applicationOfferingTuitionRemittanceAmount:
        disbursementSchedule.application.offering
          .tuitionRemittanceRequestedAmount,
      applicationOfferingStudyDelivered:
        disbursementSchedule.application.offering.offeringDelivered,
      applicationStudentName: getUserFullName(
        disbursementSchedule.application.student.user,
      ),
      applicationNumber: disbursementSchedule.application.applicationNumber,
      applicationLocationName: disbursementSchedule.application.location.name,
      applicationStatus: disbursementSchedule.application.applicationStatus,
      applicationCOEStatus: disbursementSchedule.coeStatus,
      applicationId: disbursementSchedule.application.id,
      applicationWithinCOEWindow: this.applicationService.withinValidCOEWindow(
        disbursementSchedule.disbursementDate,
      ),
      applicationLocationId: disbursementSchedule.application.location.id,
      applicationDeniedReason: getCOEDeniedReason(disbursementSchedule),
      studyBreaks: disbursementSchedule.application.offering.studyBreaks?.map(
        (studyBreak) => ({
          breakStartDate: dateString(studyBreak.breakStartDate),
          breakEndDate: dateString(studyBreak.breakEndDate),
        }),
      ),
      applicationPIRStatus: disbursementSchedule.application.pirStatus,
      disbursementDate: getExtendedDateFormat(
        disbursementSchedule.disbursementDate,
      ),
    };
  }

  /**
   * Approve confirmation of enrollment(COE).
   ** An application can have up to two COEs based on the disbursement.
   ** Hence COE Approval happens twice for application with more than once disbursement.
   ** Irrespective of number of COEs to be approved, Application status is set to complete
   ** on first COE approval.
   * @param locationId location id of the application
   * @param disbursementScheduleId disbursement schedule id of COE
   */
  @HasLocationAccess("locationId")
  @Patch(
    ":locationId/confirmation-of-enrollment/disbursement/:disbursementScheduleId/confirm",
  )
  async confirmEnrollment(
    @Param("locationId") locationId: number,
    @Param("disbursementScheduleId") disbursementScheduleId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    // Get the disbursement and application summary for COE.
    const disbursementSchedule =
      await this.disbursementScheduleService.getDisbursementAndApplicationSummary(
        locationId,
        disbursementScheduleId,
      );

    if (!disbursementSchedule) {
      throw new NotFoundException(COE_NOT_FOUND_MESSAGE);
    }
    // institution user can only confirm COE, when the student is
    // within COE_WINDOW of disbursement date
    if (
      !this.applicationService.withinValidCOEWindow(
        disbursementSchedule.disbursementDate,
      )
    ) {
      throw new UnprocessableEntityException(
        `Confirmation of Enrollment window is greater than ${COE_WINDOW} days`,
      );
    }

    const firstOutstandingDisbursement =
      await this.disbursementScheduleService.getFirstCOEOfApplication(
        disbursementSchedule.application.id,
        true,
      );

    if (disbursementSchedule.id !== firstOutstandingDisbursement.id) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          FIRST_COE_NOT_COMPLETE_MESSAGE,
          FIRST_COE_NOT_COMPLETE,
        ),
      );
    }

    await this.disbursementScheduleService.updateDisbursementAndApplicationCOEApproval(
      disbursementScheduleId,
      userToken.userId,
      disbursementSchedule.application.id,
      disbursementSchedule.application.applicationStatus,
    );

    /** Send COE confirmation message only for first COE.
     ** Note: If first COE is completed, then application status is moved to Completed.
     ** In that case, COE confirmation message will not be sent for second COE.
     */
    if (
      disbursementSchedule.application.applicationStatus ===
      ApplicationStatus.enrollment
    ) {
      await this.workflow.sendConfirmCOEMessage(
        disbursementSchedule.application.assessmentWorkflowId,
      );
    }
  }

  /**
   * Deny the Confirmation Of Enrollment(COE).
   ** Note: If an application has 2 COEs, and if the first COE is Rejected then 2nd COE is implicitly rejected.
   * @param locationId location that is completing the COE.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param payload contains the denied reason of the
   * student application.
   */
  @HasLocationAccess("locationId")
  @Patch(
    ":locationId/confirmation-of-enrollment/disbursement/:disbursementScheduleId/deny",
  )
  async denyConfirmationOfEnrollment(
    @Param("locationId") locationId: number,
    @Param("disbursementScheduleId") disbursementScheduleId: number,
    @Body() payload: DenyConfirmationOfEnrollmentDto,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    if (
      payload.coeDenyReasonId === COE_DENIED_REASON_OTHER_ID &&
      !payload.otherReasonDesc
    ) {
      throw new UnprocessableEntityException(
        "Other is selected as COE reason, specify the reason for the COE denial.",
      );
    }
    const disbursementSchedule =
      await this.disbursementScheduleService.getDisbursementAndApplicationSummary(
        locationId,
        disbursementScheduleId,
      );

    if (!disbursementSchedule) {
      throw new NotFoundException(
        "Unable to find a COE which could be completed.",
      );
    }
    await this.disbursementScheduleService.updateCOEToDeny(
      disbursementSchedule.application.id,
      userToken.userId,
      payload.coeDenyReasonId,
      payload.otherReasonDesc,
    );

    if (
      disbursementSchedule.application.applicationStatus ===
        ApplicationStatus.enrollment &&
      disbursementSchedule.application.assessmentWorkflowId
    ) {
      await this.workflow.deleteApplicationAssessment(
        disbursementSchedule.application.assessmentWorkflowId,
      );
    }
  }

  /**
   * Get all COE denied reason, which are active
   * @returns COE denied reason list
   */
  @Get("confirmation-of-enrollment/denial-reasons")
  async getCOEDeniedReason(): Promise<COEDeniedReasonDto[]> {
    const coeDeniedReason =
      await this.deniedCOEReasonService.getCOEDeniedReasons();
    return coeDeniedReason.map((eachCOEDeniedReason) => ({
      value: eachCOEDeniedReason.id,
      label: eachCOEDeniedReason.reason,
    }));
  }
}
