import HttpBaseClient from "./common/HttpBaseClient";
import {
  OfferingDTO,
  OfferingDateDTO,
} from "../../types/contracts/OfferingContact";
import { EducationProgramOfferingDto, OptionItemDto } from "../../types";

export class EducationProgramOfferingApi extends HttpBaseClient {
  /**
   * Creates program offering and returns the id of the created resource.
   * @param locationId location id.
   * @param programId program id.
   * @param createProgramOfferingDto
   * @returns program offering id created.
   */
  public async createProgramOffering(
    locationId: number,
    programId: number,
    createProgramOfferingDto: OfferingDTO,
  ): Promise<number> {
    try {
      const response = await this.apiClient.post(
        `institution/offering/location/${locationId}/education-program/${programId}`,
        createProgramOfferingDto,
        this.addAuthHeader(),
      );
      return +response.data;
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

  /**
   * Gets program offerings for location authorized for students.
   * @param locationId location id.
   * @param programId program id.
   * @returns program offerings for location.
   */
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

  /**
   * Gets program offering date
   * @param locationId location id.
   * @param programId program id.
   * @param offeringId offering id
   * @returns offering date for the given offering
   */
  public async getProgramOfferingDate(
    locationId: number,
    programId: number,
    offeringId: number,
  ): Promise<OfferingDateDTO> {
    try {
      const response = await this.apiClient.get(
        `institution/offering/location/${locationId}/education-program/${programId}/offering/${offeringId}/date`,
        this.addAuthHeader(),
      );
      return response.data as OfferingDateDTO;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Gets program offerings for location authorized
   * for a apticular institution.
   * @param locationId location id.
   * @param programId program id.
   * @returns program offerings for location authorized
   * for a apticular institution.
   */
  public async getProgramOfferingsForLocationForInstitution(
    locationId: number,
    programId: number,
  ): Promise<OptionItemDto[]> {
    try {
      const response = await this.apiClient.get(
        `institution/offering/location/${locationId}/education-program/${programId}/offerings-list`,
        this.addAuthHeader(),
      );
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
