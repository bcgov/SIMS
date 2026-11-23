import ApiClient from "@/services/http/ApiClient";
import {
  CancelMSFAAAPIInDTO,
  MSFAANumberAPIOutDTO,
  ReissueMSFAAAPIInDTO,
} from "@/services/http/dto";

/**
 * Client service layer for MSFAA number activity.
 */
export class MSFAANumberService {
  // Shared Instance
  private static instance: MSFAANumberService;

  static get shared(): MSFAANumberService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Gets the full MSFAA activity for a student.
   * @param studentId student id to retrieve MSFAA records.
   * @returns list of MSFAA activity records for the student.
   */
  async getStudentMSFAAActivity(
    studentId: number,
  ): Promise<MSFAANumberAPIOutDTO[]> {
    return ApiClient.MSFAANumberApi.getStudentMSFAAActivity(studentId);
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
    await ApiClient.MSFAANumberApi.cancelMSFAANumber(msfaaNumberId, payload);
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
    await ApiClient.MSFAANumberApi.reissueMSFAANumber(msfaaNumberId, payload);
  }
}
