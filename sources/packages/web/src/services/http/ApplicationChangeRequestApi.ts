import { ApplicationChangeRequestAPIInDTO } from "@/services/http/dto/ApplicationChangeRequest.dto";
import HttpBaseClient from "./common/HttpBaseClient";

export class ApplicationChangeRequestApi extends HttpBaseClient {
  /**
   * Assesses an application change request.
   * @param applicationId application id.
   * @param payload application data.
   */
  async assessApplicationChangeRequest(
    applicationChangeRequestId: number,
    payload: ApplicationChangeRequestAPIInDTO,
  ): Promise<void> {
    const url = `application-change-request/${applicationChangeRequestId}`;
    await this.patchCall(this.addClientRoot(url), payload);
  }
}
