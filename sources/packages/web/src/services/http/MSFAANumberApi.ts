import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  CancelMSFAAAPIInDTO,
  MSFAANumberAPIOutDTO,
  ReissueMSFAAAPIInDTO,
} from "@/services/http/dto";

/**
 * Http API client for MSFAA number activity.
 */
export class MSFAANumberApi extends HttpBaseClient {
  /**
   * Gets the full MSFAA activity for a student.
   * @param studentId student id to retrieve MSFAA records.
   * @returns list of MSFAA activity records for the student.
   */
  async getStudentMSFAAActivity(
    studentId: number,
  ): Promise<MSFAANumberAPIOutDTO[]> {
    return this.getCall<MSFAANumberAPIOutDTO[]>(
      this.addClientRoot(`msfaa-number/student/${studentId}`),
    );
  }

  /**
   * Cancels an MSFAA and adds a general note to the student profile.
   * @param msfaaNumberId MSFAA to be cancelled.
   * @param payload note describing the cancellation.
   */
  async cancelMSFAANumber(
    msfaaNumberId: number,
    payload: CancelMSFAAAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`msfaa-number/${msfaaNumberId}/cancel`),
      payload,
    );
  }

  /**
   * Reissues a cancelled MSFAA and adds a general note to the student profile.
   * @param msfaaNumberId cancelled MSFAA to be reissued.
   * @param payload note describing the reissue.
   */
  async reissueMSFAANumber(
    msfaaNumberId: number,
    payload: ReissueMSFAAAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot(`msfaa-number/${msfaaNumberId}/reissue`),
      payload,
    );
  }
}
