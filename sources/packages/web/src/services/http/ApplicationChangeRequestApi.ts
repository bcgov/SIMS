import { ApplicationChangeRequestAPIInDTO } from "@/services/http/dto/ApplicationChangeRequest.dto";
import HttpBaseClient from "@/services/http/common/HttpBaseClient";

export class ApplicationChangeRequestApi extends HttpBaseClient {
  /**
   * Assesses an application change request.
   * @param applicationChangeRequestId application change request id.
   * @param payload application data.
   */
  async assessApplicationChangeRequest(
    applicationChangeRequestId: number,
    payload: ApplicationChangeRequestAPIInDTO,
  ): Promise<void> {
    // TODO: Implement the patchCall method in HttpBaseClient
  }
}
