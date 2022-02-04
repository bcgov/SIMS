import {
  COESummaryDTO,
  ApplicationDetailsForCOEDTO,
  COEDeniedReasonDto,
  DenyConfirmationOfEnrollment,
  EnrollmentPeriod,
} from "@/types";
import ApiClient from "./http/ApiClient";

export class ConfirmationOfEnrollmentService {
  // Share Instance
  private static instance: ConfirmationOfEnrollmentService;

  public static get shared(): ConfirmationOfEnrollmentService {
    return this.instance || (this.instance = new this());
  }

  public async getCOESummary(
    locationId: number,
    enrollmentPeriod: EnrollmentPeriod,
  ): Promise<COESummaryDTO[]> {
    return ApiClient.ConfirmationOfEnrollment.getCOESummary(
      locationId,
      enrollmentPeriod,
    );
  }

  public async getApplicationForCOE(
    disbursementScheduleId: number,
    locationId: number,
  ): Promise<ApplicationDetailsForCOEDTO> {
    return ApiClient.ConfirmationOfEnrollment.getApplicationForCOE(
      disbursementScheduleId,
      locationId,
    );
  }

  public async confirmCOE(
    locationId: number,
    disbursementScheduleId: number,
  ): Promise<void> {
    await ApiClient.ConfirmationOfEnrollment.confirmCOE(
      locationId,
      disbursementScheduleId,
    );
  }

  public async rollbackCOE(
    locationId: number,
    applicationId: number,
  ): Promise<void> {
    await ApiClient.ConfirmationOfEnrollment.rollbackCOE(
      locationId,
      applicationId,
    );
  }

  public async getCOEDenialReasons(): Promise<COEDeniedReasonDto> {
    return ApiClient.ConfirmationOfEnrollment.getCOEDenialReasons();
  }

  public async denyConfirmationOfEnrollment(
    locationId: number,
    applicationId: number,
    denyCOEPayload: DenyConfirmationOfEnrollment,
  ): Promise<void> {
    await ApiClient.ConfirmationOfEnrollment.denyConfirmationOfEnrollment(
      locationId,
      applicationId,
      denyCOEPayload,
    );
  }
}
