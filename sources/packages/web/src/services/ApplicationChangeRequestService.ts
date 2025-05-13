import ApiClient from "../services/http/ApiClient";
import { ApplicationChangeRequestAPIInDTO } from "@/services/http/dto/ApplicationChangeRequest.dto";

export class ApplicationChangeRequestService {
  // Share Instance
  private static instance: ApplicationChangeRequestService;

  static get shared(): ApplicationChangeRequestService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Assesses an application change request.
   * @param applicationId application id.
   * @param payload information to update the application offering change request status.
   */
  async assessApplicationChangeRequest(
    applicationId: number,
    payload: ApplicationChangeRequestAPIInDTO,
  ): Promise<void> {
    await ApiClient.ApplicationChangeRequestApi.assessApplicationChangeRequest(
      applicationId,
      payload,
    );
  }
}
