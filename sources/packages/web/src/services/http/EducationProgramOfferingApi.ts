import HttpBaseClient from "./common/HttpBaseClient";
import { Offering } from "../../types/contracts/OfferingContact";
import { EducationProgramOfferingDto } from "../../types";

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

  public async getAllEducationProgramOffering(
    locationId: number,
    programId: number,
  ): Promise<EducationProgramOfferingDto[]> {
    try {
      const response = await this.apiClient.get(
        `institution/offering/location/${locationId}/education-program/${programId}`,
        this.addAuthHeader(),
      );
      return response.data as EducationProgramOfferingDto[];
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
