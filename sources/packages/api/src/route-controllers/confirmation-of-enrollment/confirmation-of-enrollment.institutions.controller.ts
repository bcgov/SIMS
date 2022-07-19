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
  ParseEnumPipe,
  ParseIntPipe,
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
  DisbursementValueType,
} from "../../database/entities";
import { COESummaryAPIOutDTO } from "../application/models/application.model";
import { getUserFullName } from "../../utilities/auth-utils";
import {
  dateString,
  COE_WINDOW,
  getCOEDeniedReason,
  COE_DENIED_REASON_OTHER_ID,
  getExtendedDateFormat,
  getISODateOnlyString,
  getTotalDisbursementAmount,
  CustomNamedError,
} from "../../utilities";
import {
  ApplicationDetailsForCOEDTO,
  DenyConfirmationOfEnrollmentDto,
  COEDeniedReasonDto,
  ConfirmationOfEnrollmentAPIInDTO,
} from "./models/confirmation-of-enrollment.model";
import { EnrollmentPeriod } from "../../services/disbursement-schedule-service/disbursement-schedule.models";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
} from "../../constants";
import {
  ConfirmationOfEnrollmentPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";

const COE_NOT_FOUND_MESSAGE =
  "Confirmation of enrollment not found or application status not valid.";

const FIRST_COE_NOT_COMPLETE_MESSAGE =
  "First disbursement(COE) not complete. Please complete the first disbursement.";

const INVALID_TUITION_REMITTANCE_AMOUNT_MESSAGE =
  "Tuition amount provided should be lesser than both (Actual tuition + Program related costs) and (Canada grants + Canada Loan + BC Loan).";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("location")
@ApiTags(`${ClientTypeBaseRoute.Institution}-location`)
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
   * @param locationId location to retrieve confirmation of enrollments.
   * @param enrollmentPeriod types of the period (e.g. current, upcoming)
   * @param paginationOptions options for pagination.
   * @returns COE paginated result.
   */
  @HasLocationAccess("locationId")
  @Get(
    ":locationId/confirmation-of-enrollment/enrollmentPeriod/:enrollmentPeriod",
  )
  async getCOESummary(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("enrollmentPeriod", new ParseEnumPipe(EnrollmentPeriod))
    enrollmentPeriod: EnrollmentPeriod,
    @Query()
    paginationOptions: ConfirmationOfEnrollmentPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<COESummaryAPIOutDTO>> {
    const disbursementPaginatedResult =
      await this.disbursementScheduleService.getCOEByLocation(
        locationId,
        enrollmentPeriod,
        paginationOptions,
      );
    return {
      results: disbursementPaginatedResult.results.map(
        (disbursement: DisbursementSchedule) => {
          const offering = disbursement.studentAssessment.offering;
          return {
            applicationNumber:
              disbursement.studentAssessment.application.applicationNumber,
            applicationId: disbursement.studentAssessment.application.id,
            studyStartPeriod: getISODateOnlyString(offering.studyStartDate),
            studyEndPeriod: getISODateOnlyString(offering.studyEndDate),
            coeStatus: disbursement.coeStatus,
            fullName: getUserFullName(
              disbursement.studentAssessment.application.student.user,
            ),
            disbursementScheduleId: disbursement.id,
            disbursementDate: getISODateOnlyString(
              disbursement.disbursementDate,
            ),
          };
        },
      ),
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
  @ApiUnprocessableEntityResponse({ description: "" })
  @ApiNotFoundResponse({
    description:
      "Student Application was not found or the location does not have access to it or PIR not required Application.",
  })
  async startCOERollback(
    @UserToken() userToken: IUserToken,
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      // Validation to check if the application is in Enrollment status and first coe is in Required status.
      // Otherwise the application is not eligible for COE override.
      const firstCOEofApplication =
        await this.disbursementScheduleService.getFirstCOEOfApplication(
          applicationId,
        );
      if (
        !firstCOEofApplication ||
        !(
          firstCOEofApplication.studentAssessment.application
            .applicationStatus === ApplicationStatus.enrollment &&
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

      if (result.overriddenApplication.currentAssessment.assessmentWorkflowId) {
        await this.workflow.deleteApplicationAssessment(
          result.overriddenApplication.currentAssessment.assessmentWorkflowId,
        );
      }

      await this.assessmentService.startAssessment(result.createdAssessment.id);

      return { id: result.createdApplication.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
            throw new UnprocessableEntityException(error.message);
          default:
            throw error;
        }
      }
      throw error;
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

    const offering = disbursementSchedule.studentAssessment.offering;
    return {
      applicationProgramName: offering.educationProgram.name,
      applicationProgramDescription: offering.educationProgram.description,
      applicationOfferingName: offering.name,
      applicationOfferingIntensity: offering.offeringIntensity,
      applicationOfferingStartDate: dateString(offering.studyStartDate),
      applicationOfferingEndDate: dateString(offering.studyEndDate),
      applicationOfferingHasStudyBreak: offering.lacksStudyBreaks,
      applicationOfferingActualTuition: offering.actualTuitionCosts,
      applicationOfferingProgramRelatedCost: offering.programRelatedCosts,
      applicationOfferingMandatoryCost: offering.mandatoryFees,
      applicationOfferingExceptionalExpenses: offering.exceptionalExpenses,
      applicationOfferingStudyDelivered: offering.offeringDelivered,
      applicationStudentName: getUserFullName(
        disbursementSchedule.studentAssessment.application.student.user,
      ),
      applicationNumber:
        disbursementSchedule.studentAssessment.application.applicationNumber,
      applicationLocationName: offering.institutionLocation.name,
      applicationStatus:
        disbursementSchedule.studentAssessment.application.applicationStatus,
      applicationCOEStatus: disbursementSchedule.coeStatus,
      applicationId: disbursementSchedule.studentAssessment.application.id,
      applicationWithinCOEWindow: this.applicationService.withinValidCOEWindow(
        disbursementSchedule.disbursementDate,
      ),
      applicationLocationId: offering.institutionLocation.id,
      applicationDeniedReason: getCOEDeniedReason(disbursementSchedule),
      studyBreaks: offering.studyBreaks?.studyBreaks?.map((studyBreak) => ({
        breakStartDate: dateString(studyBreak.breakStartDate),
        breakEndDate: dateString(studyBreak.breakEndDate),
      })),
      applicationPIRStatus:
        disbursementSchedule.studentAssessment.application.pirStatus,
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
  @ApiUnprocessableEntityResponse({
    description:
      "Tuition amount provided should be lesser than both (Actual tuition + Program related costs) and (Canada grants + Canada Loan + BC Loan). OR First disbursement(COE) not complete. Please complete the first disbursement.",
  })
  @HasLocationAccess("locationId")
  @Patch(
    ":locationId/confirmation-of-enrollment/disbursement/:disbursementScheduleId/confirm",
  )
  async confirmEnrollment(
    @Param("locationId") locationId: number,
    @Param("disbursementScheduleId") disbursementScheduleId: number,
    @Body() payload: ConfirmationOfEnrollmentAPIInDTO,
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
        disbursementSchedule.studentAssessment.application.id,
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

    const disbursementAmount = getTotalDisbursementAmount(
      disbursementSchedule.disbursementValues,
      [
        DisbursementValueType.CanadaLoan,
        DisbursementValueType.BCLoan,
        DisbursementValueType.CanadaGrant,
      ],
    );

    /**
     * Enable Institution Users to request tuition remittance at the time
     * of confirming enrolment, not to exceed the lesser than both
     * (Actual tuition + Program related costs) and (Canada grants + Canada Loan + BC Loan).
     */
    const offering = disbursementSchedule.studentAssessment.offering;
    const offeringAmount =
      offering.actualTuitionCosts + offering.programRelatedCosts;
    const maxTuitionAllowed = Math.min(offeringAmount, disbursementAmount);

    if (payload.tuitionRemittanceAmount > maxTuitionAllowed) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          INVALID_TUITION_REMITTANCE_AMOUNT_MESSAGE,
          INVALID_TUITION_REMITTANCE_AMOUNT,
        ),
      );
    }

    await this.disbursementScheduleService.updateDisbursementAndApplicationCOEApproval(
      disbursementScheduleId,
      userToken.userId,
      disbursementSchedule.studentAssessment.application.id,
      disbursementSchedule.studentAssessment.application.applicationStatus,
      payload.tuitionRemittanceAmount,
    );

    /** Send COE confirmation message only for first COE.
     ** Note: If first COE is completed, then application status is moved to Completed.
     ** In that case, COE confirmation message will not be sent for second COE.
     */
    if (
      disbursementSchedule.studentAssessment.application.applicationStatus ===
      ApplicationStatus.enrollment
    ) {
      await this.workflow.sendConfirmCOEMessage(
        disbursementSchedule.studentAssessment.assessmentWorkflowId,
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
      disbursementSchedule.studentAssessment.application.id,
      userToken.userId,
      payload.coeDenyReasonId,
      payload.otherReasonDesc,
    );

    if (
      disbursementSchedule.studentAssessment.application.applicationStatus ===
        ApplicationStatus.enrollment &&
      disbursementSchedule.studentAssessment.assessmentWorkflowId
    ) {
      await this.workflow.deleteApplicationAssessment(
        disbursementSchedule.studentAssessment.assessmentWorkflowId,
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
