import { COESummaryDTO, ApplicationDetailsForCOEDTO } from "@/types";
import ApiClient from "./http/ApiClient";

export class ConfirmationOfEnrollmentService {
  // Share Instance
  private static instance: ConfirmationOfEnrollmentService;

  public static get shared(): ConfirmationOfEnrollmentService {
    return this.instance || (this.instance = new this());
  }

  public async getCOESummary(locationId: number): Promise<COESummaryDTO[]> {
    return ApiClient.ConfirmationOfEnrollment.getCOESummary(locationId);
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
}
