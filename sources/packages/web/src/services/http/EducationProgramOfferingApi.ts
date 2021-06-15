import HttpBaseClient from "./common/HttpBaseClient";
import { Offering } from "../../types/contracts/OfferingContact";

export class EducationProgramOfferingApi extends HttpBaseClient {
  public async createProgramOffering(
    locationId: number,
    programId: number,
    createProgramOfferingDto: Offering,
  ): Promise<void> {
    try {
      await this.apiClient.post(
        `institution/offering/location/${locationId}/education-program/${programId}`,
        createProgramOfferingDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
