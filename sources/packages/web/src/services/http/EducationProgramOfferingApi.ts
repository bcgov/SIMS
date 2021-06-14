import HttpBaseClient from "./common/HttpBaseClient";

export class EducationProgramOfferingApi extends HttpBaseClient {
  public async createProgramOffering(
    locationId: number,
    programId: number,
    createProgramOfferingDto: any,
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
