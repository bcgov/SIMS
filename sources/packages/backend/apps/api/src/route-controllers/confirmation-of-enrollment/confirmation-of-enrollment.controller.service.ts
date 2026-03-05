import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ConfirmationOfEnrollmentService } from "@sims/services";
import { ApiProcessError } from "../../types";
import BaseController from "../BaseController";
import { ConfirmEnrollmentOptions } from "./models/confirmation-of-enrollment.models";
import { CustomNamedError } from "@sims/utilities";
import {
  ENROLMENT_ALREADY_COMPLETED,
  ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD,
  ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ENROLMENT_NOT_FOUND,
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
  TUITION_REMITTANCE_NOT_ALLOWED,
} from "@sims/services/constants";

@Injectable()
export class ConfirmationOfEnrollmentControllerService extends BaseController {
  constructor(
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
  ) {
    super();
  }

  /**
   * Approve confirmation of enrollment(COE).
   * An application can have up to two COEs based on the disbursement schedule,
   * hence the COE approval happens twice for application with more than once disbursement.
   * Irrespective of number of COEs to be approved, application status is set to complete
   * on first COE approval.
   * @param disbursementScheduleId disbursement schedule id of COE.
   * @param auditUserId user who confirms enrollment.
   * @param tuitionRemittanceAmount tuition remittance amount.
   * @param options Confirm COE options.
   */
  async confirmEnrollment(
    disbursementScheduleId: number,
    auditUserId: number,
    tuitionRemittanceAmount: number,
    options?: ConfirmEnrollmentOptions,
  ): Promise<void> {
    try {
      await this.confirmationOfEnrollmentService.confirmEnrollment(
        disbursementScheduleId,
        auditUserId,
        tuitionRemittanceAmount,
        {
          locationId: options?.locationId,
          allowOutsideCOEApprovalPeriod: options?.allowOutsideCOEApprovalPeriod,
        },
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case ENROLMENT_NOT_FOUND:
            throw new NotFoundException(error.message);
          case ENROLMENT_ALREADY_COMPLETED:
          case ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
          case ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD:
            throw new UnprocessableEntityException(error.message);
          case FIRST_COE_NOT_COMPLETE:
          case INVALID_TUITION_REMITTANCE_AMOUNT:
          case TUITION_REMITTANCE_NOT_ALLOWED:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }
}
