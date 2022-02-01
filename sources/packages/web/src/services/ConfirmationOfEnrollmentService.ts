import {
  COESummaryDTO,
  ApplicationDetailsForCOEDTO,
  COEDeniedReasonDto,
  DenyConfirmationOfEnrollment,
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
    upcomingCOE?: boolean,
  ): Promise<COESummaryDTO[]> {
    return ApiClient.ConfirmationOfEnrollment.getCOESummary(
      locationId,
      upcomingCOE,
    );
  }

  public async getApplicationForCOE(
    applicationId: number,
    locationId: number,
  ): Promise<ApplicationDetailsForCOEDTO> {
    return ApiClient.ConfirmationOfEnrollment.getApplicationForCOE(
      applicationId,
      locationId,
    );
  }

  public async confirmCOE(
    locationId: number,
    applicationId: number,
  ): Promise<void> {
    await ApiClient.ConfirmationOfEnrollment.confirmCOE(
      locationId,
      applicationId,
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
