import HttpBaseClient from "./common/HttpBaseClient";
import { OfferingDTO } from "../../types/contracts/OfferingContact";
import { EducationProgramOfferingDto, OptionItemDto } from "../../types";

export class EducationProgramOfferingApi extends HttpBaseClient {
  public async createProgramOffering(
    locationId: number,
    programId: number,
    createProgramOfferingDto: OfferingDTO,
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

  public async getProgramOffering(
    locationId: number,
    programId: number,
    offeringId: number,
  ): Promise<OfferingDTO> {
    try {
      const response = await this.apiClient.get(
        `institution/offering/location/${locationId}/education-program/${programId}/offering/${offeringId}`,
        this.addAuthHeader(),
      );
      return response.data as OfferingDTO;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async updateProgramOffering(
    locationId: number,
    programId: number,
    offeringId: number,
    updateProgramOfferingDto: OfferingDTO,
  ): Promise<void> {
    try {
      await this.apiClient.patch(
        `institution/offering/location/${locationId}/education-program/${programId}/offering/${offeringId}`,
        updateProgramOfferingDto,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getProgramOfferingsForLocation(
    locationId: number,
    programId: number,
  ): Promise<OptionItemDto[]> {
    try {
      const response = await this.apiClient.get(
        `institution/offering/location/${locationId}/education-program/${programId}/options-list`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
