import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  CompleteProgramInfoRequestAPIInDTO,
  DenyProgramInfoRequestAPIInDTO,
  PIRDeniedReasonAPIOutDTO,
  PIRSummaryAPIOutDTO,
  ProgramInfoRequestAPIOutDTO,
} from "@/services/http/dto";

export class ProgramInfoRequestApi extends HttpBaseClient {
  /**
   * Gets the information to show a Program Information Request (PIR)
   * with the data provided by the student, either when student select
   * an existing program or not.
   * @param locationId location id.
   * @param applicationId application id.
   * @returns program information request.
   */
  async getProgramInfoRequest(
    locationId: number,
    applicationId: number,
  ): Promise<ProgramInfoRequestAPIOutDTO> {
    return this.getCallTyped(
      this.addClientRoot(
        `location/${locationId}/program-info-request/application/${applicationId}`,
      ),
    );
  }

  /**
   * Completes the Program Info Request (PIR), defining the
   * PIR status as completed in the student application table.
   * The PIR is completed by select an existing offering.
   * @param locationId location that is completing the PIR.
   * @param applicationId application id to be updated.
   * @param payload offering to be updated in the student application.
   */
  async completeProgramInfoRequest(
    locationId: number,
    applicationId: number,
    payload: CompleteProgramInfoRequestAPIInDTO,
  ): Promise<void> {
    try {
      await this.patchCall(
        this.addClientRoot(
          `location/${locationId}/program-info-request/application/${applicationId}/complete`,
        ),
        payload,
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }

  /**
   * Deny the Program Info Request (PIR), defining the
   * PIR status as Declined in the student application table.
   * @param locationId location that is completing the PIR.
   * @param applicationId application id to be updated.
   * @param payload contains the denied reason of the student application.
   */
  async denyProgramInfoRequest(
    locationId: number,
    applicationId: number,
    payload: DenyProgramInfoRequestAPIInDTO,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(
        `location/${locationId}/program-info-request/application/${applicationId}/deny`,
      ),
      payload,
    );
  }

  /**
   * Get all applications of a location in an institution
   * with Program Info Request (PIR) status completed and required
   * @param locationId location that is completing the PIR.
   * @returns student application list of an institution location.
   */
  async getPIRSummary(locationId: number): Promise<PIRSummaryAPIOutDTO[]> {
    return this.getCallTyped<PIRSummaryAPIOutDTO[]>(
      this.addClientRoot(`location/${locationId}/program-info-request`),
    );
  }

  /**
   * Get all PIR denied reasons, which are active.
   * @returns PIR denied reason list.
   */
  async getPIRDeniedReasonList(): Promise<PIRDeniedReasonAPIOutDTO[]> {
    return this.getCallTyped(
      this.addClientRoot(`location/program-info-request/denied-reason`),
    );
  }
}
