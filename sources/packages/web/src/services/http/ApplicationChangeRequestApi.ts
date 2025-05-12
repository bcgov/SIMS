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
    // TODO: Implement the patchCall method in HttpBaseClient
    // const url = `application-change-request/${applicationChangeRequestId}`;
    // await this.patchCall(this.addClientRoot(url), payload);
  }
}
