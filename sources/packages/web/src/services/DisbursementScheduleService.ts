import ApiClient from "@/services/http/ApiClient";
import { CancelDisbursementScheduleAPIInDTO } from "@/services/http/dto";

export class DisbursementScheduleService {
  // Share Instance
  private static instance: DisbursementScheduleService;

  static get shared(): DisbursementScheduleService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Cancels a disbursement schedule.
   * @param disbursementScheduleId disbursement schedule ID.
   * @param payload payload with the cancellation info.
   */
  async cancelDisbursementSchedule(
    disbursementScheduleId: number,
    payload: CancelDisbursementScheduleAPIInDTO,
  ): Promise<void> {
    return ApiClient.DisbursementSchedule.cancelDisbursementSchedule(
      disbursementScheduleId,
      payload,
    );
  }
}
