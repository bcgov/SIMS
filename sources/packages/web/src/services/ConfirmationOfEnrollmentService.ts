import { COESummaryDTO } from "@/types";
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
}
