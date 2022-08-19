import ApiClient from "./http/ApiClient";
import {
  OptionItemDto,
  OfferingIntensity,
  OfferingDTO,
  ProgramOfferingDetailsDto,
  PaginatedResults,
  PaginationOptions,
} from "@/types";
import {
  OfferingAssessmentAPIInDTO,
  OfferingChangeAssessmentAPIInDTO,
  OfferingChangeRequestAPIOutDTO,
  PrecedingOfferingSummaryAPIOutDTO,
  EducationProgramOfferingAPIOutDTO,
  EducationProgramOfferingSummaryAPIOutDTO,
  EducationProgramOfferingAPIInDTO,
} from "@/services/http/dto";

export class EducationProgramOfferingService {
  // Share Instance
  private static instance: EducationProgramOfferingService;

  public static get shared(): EducationProgramOfferingService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Creates offering.
   * @param locationId offering location.
   * @param programId offering program.
   * @param payload offering data.
   */
  public async createProgramOffering(
    locationId: number,
    programId: number,
    payload: EducationProgramOfferingAPIOutDTO,
  ): Promise<void> {
    return ApiClient.EducationProgramOffering.createOffering(
      locationId,
      programId,
      payload,
    );
  }

  /**
   * Get summary of offerings for a program and location.
   * Pagination, sort and search are available on results.
   * @param locationId offering location.
   * @param programId offering program.
   * @param paginationOptions pagination options.
   * @returns offering summary results.
   */
  public async getOfferingsSummary(
    locationId: number,
    programId: number,
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResults<EducationProgramOfferingSummaryAPIOutDTO>> {
    return ApiClient.EducationProgramOffering.getOfferingsSummary(
      locationId,
      programId,
      paginationOptions,
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

  /**
   * Update offering.
   ** An offering which has at least one student aid application submitted
   ** cannot be modified further except the offering name. In such cases
   ** the offering must be requested for change.
   * @param payload offering data to be updated.
   * @param locationId offering location.
   * @param programId offering program.
   * @param offeringId offering to be modified.
   */
  public async updateProgramOffering(
    locationId: number,
    programId: number,
    offeringId: number,
    payload: EducationProgramOfferingAPIInDTO,
  ): Promise<void> {
    return ApiClient.EducationProgramOffering.updateProgramOffering(
      locationId,
      programId,
      offeringId,
      payload,
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
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgramOffering.getProgramOfferingsForLocation(
      locationId,
      programId,
      programYearId,
      selectedIntensity,
      isIncludeInActiveProgramYear,
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
   * for a particular institution.
   * @param locationId location id.
   * @param programId program id.
   * @returns program offerings for location authorized
   * for a particular institution.
   */
  public async getProgramOfferingsForLocationForInstitution(
    locationId: number,
    programId: number,
    programYearId: number,
    selectedOfferingIntensity: OfferingIntensity,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgramOffering.getProgramOfferingsForLocationForInstitution(
      locationId,
      programId,
      programYearId,
      selectedOfferingIntensity,
      isIncludeInActiveProgramYear,
    );
  }

  /**
   * Offering details for ministry users
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

  /**
   * Assess an offering to approve or decline.
   * @param offeringId
   * @param payload
   */
  public async assessOffering(
    offeringId: number,
    payload: OfferingAssessmentAPIInDTO,
  ): Promise<void> {
    return ApiClient.EducationProgramOffering.assessOffering(
      offeringId,
      payload,
    );
  }

  /**
   * Request a change to offering to modify it's
   * properties that affect the assessment of student application.
   **During this process a new offering is created by copying the existing
   * offering and modifying the properties required.
   * @param locationId
   * @param programId
   * @param offeringId
   * @param payload
   */
  async requestChange(
    locationId: number,
    programId: number,
    offeringId: number,
    payload: OfferingDTO,
  ): Promise<void> {
    return ApiClient.EducationProgramOffering.requestChange(
      locationId,
      programId,
      offeringId,
      payload,
    );
  }

  /**
   * Get all offerings that were requested for change.
   * @returns all offerings that were requested for change.
   */
  async getOfferingChangeRequests(): Promise<OfferingChangeRequestAPIOutDTO[]> {
    return ApiClient.EducationProgramOffering.getOfferingChangeRequests();
  }

  /**
   * For a given offering which is requested as change
   * get the summary of it's actual(preceding) offering.
   * @param offeringId actual offering id.
   * @returns preceding offering summary.
   */
  async getPrecedingOfferingSummary(
    offeringId: number,
  ): Promise<PrecedingOfferingSummaryAPIOutDTO> {
    return ApiClient.EducationProgramOffering.getPrecedingOfferingSummary(
      offeringId,
    );
  }

  /**
   * For a given offering which is requested as change
   * get the details of it's actual(preceding) offering.
   * @param offeringId actual offering id.
   * @returns preceding offering details.
   */
  async getPrecedingOfferingByActualOfferingId(
    offeringId: number,
  ): Promise<OfferingDTO> {
    return ApiClient.EducationProgramOffering.getPrecedingOfferingByActualOfferingId(
      offeringId,
    );
  }

  async assessOfferingChangeRequest(
    offeringId: number,
    payload: OfferingChangeAssessmentAPIInDTO,
  ): Promise<void> {
    await ApiClient.EducationProgramOffering.assessOfferingChangeRequest(
      offeringId,
      payload,
    );
  }
}
