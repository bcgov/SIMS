import {
  Controller,
  Param,
  Get,
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
  COEDeniedReasonService,
  DisbursementScheduleService,
} from "../../services";
import { DisbursementSchedule } from "@sims/sims-db";
import { getUserFullName } from "../../utilities/auth-utils";
import {
  getCOEDeniedReason,
  COE_DENIED_REASON_OTHER_ID,
  credentialTypeToDisplay,
  deliveryMethod,
} from "../../utilities";
import {
  COE_WINDOW,
  getDateOnlyFormat,
  getISODateOnlyString,
} from "@sims/utilities";
import {
  ApplicationDetailsForCOEAPIOutDTO,
  DenyConfirmationOfEnrollmentAPIInDTO,
  COEDeniedReasonAPIOutDTO,
  ConfirmationOfEnrollmentAPIInDTO,
  COESummaryAPIOutDTO,
} from "./models/confirmation-of-enrollment.dto";
import { EnrollmentPeriod } from "../../services/disbursement-schedule/disbursement-schedule.models";
import { ClientTypeBaseRoute } from "../../types";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  ConfirmationOfEnrollmentPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import { ConfirmationOfEnrollmentControllerService } from "./confirmation-of-enrollment.controller.service";
import {
  ConfirmationOfEnrollmentService,
  DisbursementOverawardService,
} from "@sims/services";

@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("location")
@ApiTags(
  `${ClientTypeBaseRoute.Institution}-location[confirmation-of-enrollment]`,
)
export class ConfirmationOfEnrollmentInstitutionsController extends BaseController {
  constructor(
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly deniedCOEReasonService: COEDeniedReasonService,
    private readonly confirmationOfEnrollmentControllerService: ConfirmationOfEnrollmentControllerService,
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
    private readonly disbursementOverawardService: DisbursementOverawardService,
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
          const offering =
            disbursement.studentAssessment.application.currentAssessment
              .offering;
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
   * Get the application details for the Confirmation Of Enrollment(COE).
   * @param locationId location id.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @returns application details for COE.
   */
  @HasLocationAccess("locationId")
  @ApiNotFoundResponse({
    description:
      "Confirmation of enrollment not found or application status not valid.",
  })
  @Get(
    ":locationId/confirmation-of-enrollment/disbursement-schedule/:disbursementScheduleId",
  )
  async getApplicationForCOE(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("disbursementScheduleId", ParseIntPipe)
    disbursementScheduleId: number,
  ): Promise<ApplicationDetailsForCOEAPIOutDTO> {
    const disbursementSchedule =
      await this.disbursementScheduleService.getDisbursementAndApplicationDetails(
        locationId,
        disbursementScheduleId,
      );

    if (!disbursementSchedule) {
      throw new NotFoundException(
        "Confirmation of enrollment not found or application status not valid.",
      );
    }

    const hasOverawardBalancePromise =
      this.disbursementOverawardService.hasOverawardBalance(
        disbursementSchedule.studentAssessment.application.student.id,
      );
    const maxTuitionRemittanceAllowedPromise =
      this.confirmationOfEnrollmentService.getEstimatedMaxTuitionRemittance(
        disbursementScheduleId,
      );
    const [hasOverawardBalance, maxTuitionRemittanceAllowed] =
      await Promise.all([
        hasOverawardBalancePromise,
        maxTuitionRemittanceAllowedPromise,
      ]);

    const offering =
      disbursementSchedule.studentAssessment.application.currentAssessment
        .offering;

    return {
      applicationProgramName: offering.educationProgram.name,
      applicationProgramDescription: offering.educationProgram.description,
      applicationOfferingName: offering.name,
      applicationOfferingIntensity: offering.offeringIntensity,
      applicationOfferingStartDate: getDateOnlyFormat(offering.studyStartDate),
      applicationOfferingEndDate: getDateOnlyFormat(offering.studyEndDate),
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
      coeApprovalPeriodStatus:
        this.disbursementScheduleService.getCOEApprovalPeriodStatus(
          disbursementSchedule.disbursementDate,
          offering.studyEndDate,
        ),
      applicationLocationId: offering.institutionLocation.id,
      applicationDeniedReason: getCOEDeniedReason(disbursementSchedule),
      studyBreaks: offering.studyBreaks?.studyBreaks?.map((studyBreak) => ({
        breakStartDate: getDateOnlyFormat(studyBreak.breakStartDate),
        breakEndDate: getDateOnlyFormat(studyBreak.breakEndDate),
      })),
      applicationPIRStatus:
        disbursementSchedule.studentAssessment.application.pirStatus,
      disbursementDate: disbursementSchedule.disbursementDate,
      applicationProgramCredential: credentialTypeToDisplay(
        offering.educationProgram.credentialType,
      ),
      applicationProgramDelivery: deliveryMethod(
        offering.educationProgram.deliveredOnline,
        offering.educationProgram.deliveredOnSite,
      ),
      maxTuitionRemittanceAllowed,
      hasOverawardBalance,
    };
  }

  /**
   * Approve confirmation of enrollment(COE).
   * An application can have up to two COEs based on the disbursement schedule,
   * hence the COE approval happens twice for application with more than once disbursement.
   * Irrespective of number of COEs to be approved, application status is set to complete
   * on first COE approval.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param locationId location id of the application.
   * @param payload COE confirmation information.
   */
  @HasLocationAccess("locationId")
  @ApiNotFoundResponse({
    description:
      "Confirmation of enrollment not found or application status not valid.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Tuition amount provided should be lesser than both (actual tuition + program related costs) and (Canada grants + Canada Loan + BC Loan) " +
      `or confirmation of enrollment window is greater than ${COE_WINDOW} days ` +
      "or the first disbursement(COE) is not completed and it must be completed.",
  })
  @Patch(
    ":locationId/confirmation-of-enrollment/disbursement-schedule/:disbursementScheduleId/confirm",
  )
  async confirmEnrollment(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("disbursementScheduleId", ParseIntPipe)
    disbursementScheduleId: number,
    @Body() payload: ConfirmationOfEnrollmentAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    await this.confirmationOfEnrollmentControllerService.confirmEnrollment(
      disbursementScheduleId,
      userToken.userId,
      payload,
      { locationId },
    );
  }

  /**
   * Deny the Confirmation Of Enrollment(COE).
   ** Note: If an application has 2 COEs, and if the first COE is rejected then 2nd COE is implicitly rejected.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param locationId location that is completing the COE.
   * @param payload contains the denied reason of the
   * student application.
   */
  @HasLocationAccess("locationId")
  @ApiNotFoundResponse({
    description: "Unable to find a COE which could be completed.",
  })
  @Patch(
    ":locationId/confirmation-of-enrollment/disbursement-schedule/:disbursementScheduleId/deny",
  )
  async denyConfirmationOfEnrollment(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("disbursementScheduleId", ParseIntPipe)
    disbursementScheduleId: number,
    @Body() payload: DenyConfirmationOfEnrollmentAPIInDTO,
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
        disbursementScheduleId,
        locationId,
      );

    if (!disbursementSchedule) {
      throw new NotFoundException(
        "Unable to find a COE which could be completed.",
      );
    }
    await this.disbursementScheduleService.updateCOEToDenied(
      disbursementSchedule.id,
      userToken.userId,
      payload.coeDenyReasonId,
      payload.otherReasonDesc,
    );
  }

  /**
   * Get all COE denied reasons, which are active.
   * @returns COE denied reason list.
   */
  @Get("confirmation-of-enrollment/denial-reasons")
  async getCOEDeniedReason(): Promise<COEDeniedReasonAPIOutDTO[]> {
    const coeDeniedReason =
      await this.deniedCOEReasonService.getCOEDeniedReasons();
    return coeDeniedReason.map((eachCOEDeniedReason) => ({
      value: eachCOEDeniedReason.id,
      label: eachCOEDeniedReason.reason,
    }));
  }
}
