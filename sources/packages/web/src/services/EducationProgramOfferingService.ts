import ApiClient from "./http/ApiClient";
import {
  EducationProgramOfferingDto,
  OptionItemDto,
  OfferingIntensity,
  OfferingDTO,
  ProgramOfferingDetailsDto,
} from "../types";

export class EducationProgramOfferingService {
  // Share Instance
  private static instance: EducationProgramOfferingService;

  public static get shared(): EducationProgramOfferingService {
    return this.instance || (this.instance = new this());
  }

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
    data: OfferingDTO,
  ): Promise<number> {
    return ApiClient.EducationProgramOffering.createProgramOffering(
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
    programYearId: number,
    selectedIntensity: OfferingIntensity,
    includeInActivePY?: boolean,
  ): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgramOffering.getProgramOfferingsForLocation(
      locationId,
      programId,
      programYearId,
      selectedIntensity,
      includeInActivePY,
    );
  }

  /**
   * Gets program offering details
   * @param offeringId offering id
   * @returns offering details for the given offering
   */
  public async getProgramOfferingDetails(
    offeringId: number,
  ): Promise<ProgramOfferingDetailsDto> {
    return ApiClient.EducationProgramOffering.getProgramOfferingDetails(
      offeringId,
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
    programYearId: number,
    includeInActivePY?: boolean,
  ): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgramOffering.getProgramOfferingsForLocationForInstitution(
      locationId,
      programId,
      programYearId,
      includeInActivePY,
    );
  }

  /**
   * Offering Summary for ministry users
   * @param programId program id
   * @returns Offering Summary
   */
  public async getOfferingSummaryForAEST(
    programId: number,
  ): Promise<EducationProgramOfferingDto[]> {
    return ApiClient.EducationProgramOffering.getOfferingSummaryForAEST(
      programId,
    );
  }

  /**
   * Offering Summary for ministry users
   * @param offeringId offering id
   * @returns Offering details
   */
  public async getProgramOfferingForAEST(
    offeringId: number,
  ): Promise<OfferingDTO> {
    return ApiClient.EducationProgramOffering.getProgramOfferingForAEST(
      offeringId,
    );
  }
}
