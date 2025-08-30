import HttpBaseClient from "./common/HttpBaseClient";
import { CancelDisbursementScheduleAPIInDTO } from "@/services/http/dto";

/**
 * Http API client for disbursement schedules.
 */
export class DisbursementScheduleApi extends HttpBaseClient {
  /**
   * Cancels a disbursement schedule.
   * @param disbursementScheduleId disbursement schedule ID.
   * @param payload payload with the cancellation info.
   */
  async cancelDisbursementSchedule(
    disbursementScheduleId: number,
    payload: CancelDisbursementScheduleAPIInDTO,
  ): Promise<void> {
    return this.patchCall(
      this.addClientRoot(
        `disbursement-schedule/${disbursementScheduleId}/cancel`,
      ),
      payload,
    );
  }
}
