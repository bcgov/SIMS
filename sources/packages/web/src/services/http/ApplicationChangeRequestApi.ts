import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { ApplicationChangeRequestAPIInDTO } from "@/services/http/dto/ApplicationChangeRequest.dto";

export class ApplicationChangeRequestApi extends HttpBaseClient {
  /**
   * Assesses an application change request.
   * @param applicationId application id.
   * @param payload application data.
   */
  async assessApplicationChangeRequest(
    applicationId: number,
    payload: ApplicationChangeRequestAPIInDTO,
  ): Promise<void> {
    const url = `application-change-request/${applicationId}`;
    await this.patchCall(this.addClientRoot(url), payload);
  }
}
