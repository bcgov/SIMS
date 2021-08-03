import ApiClient from "./http/ApiClient";
import { OfferingDTO } from "../types/contracts/OfferingContact";
import { EducationProgramOfferingDto, OptionItemDto } from "../types";

export class EducationProgramOfferingService {
  // Share Instance
  private static instance: EducationProgramOfferingService;

  public static get shared(): EducationProgramOfferingService {
    return this.instance || (this.instance = new this());
  }

  public async createProgramOffering(
    locationId: number,
    programId: number,
    data: OfferingDTO,
  ): Promise<void> {
    await ApiClient.EducationProgramOffering.createProgramOffering(
      locationId,
      programId,
      data,
    );
  }

  public async getAllEducationProgramOffering(
    locationId: number,
    programId: number,
  ): Promise<EducationProgramOfferingDto[]> {
    return ApiClient.EducationProgramOffering.getAllEducationProgramOffering(
      locationId,
      programId,
    );
  }

  public async getProgramOffering(
    locationId: number,
    programId: number,
    offeringId: number,
  ): Promise<OfferingDTO> {
    return ApiClient.EducationProgramOffering.getProgramOffering(
      locationId,
      programId,
      offeringId,
    );
  }

  public async updateProgramOffering(
    locationId: number,
    programId: number,
    offeringId: number,
    data: OfferingDTO,
  ): Promise<void> {
    return ApiClient.EducationProgramOffering.updateProgramOffering(
      locationId,
      programId,
      offeringId,
      data,
    );
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
    return ApiClient.EducationProgramOffering.getProgramOfferingsForLocation(
      locationId,
      programId,
    );
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
    return ApiClient.EducationProgramOffering.getProgramOfferingsForLocationForInstitution(
      locationId,
      programId,
    );
  }
}
