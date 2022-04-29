import ApiClient from "./http/ApiClient";
import {
  OptionItemDto,
  OfferingIntensity,
  OfferingDTO,
  ProgramOfferingDetailsDto,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  DataTableSortOrder,
  OfferingSummaryFields,
  EducationProgramOfferingDto,
  PaginatedResults,
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

  /**
   * To get the offering summary
   * @param locationId, location id
   * @param programId, program id
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageLimit, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param searchCriteria, keyword to be searched
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns offering summary.
   */
  public async getAllEducationProgramOffering(
    locationId: number,
    programId: number,
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    searchCriteria?: string,
    sortField?: OfferingSummaryFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<EducationProgramOfferingDto>> {
    return ApiClient.EducationProgramOffering.getAllEducationProgramOffering(
      locationId,
      programId,
      page,
      pageCount,
      searchCriteria,
      sortField,
      sortOrder,
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
    includeInActivePY?: boolean,
  ): Promise<OptionItemDto[]> {
    return ApiClient.EducationProgramOffering.getProgramOfferingsForLocationForInstitution(
      locationId,
      programId,
      programYearId,
      selectedOfferingIntensity,
      includeInActivePY,
    );
  }

  /**
   * To get the offering summary for ministry
   * @param locationId, location id
   * @param programId, program id
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageLimit, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param searchCriteria, keyword to be searched
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns offering summary.
   */
  public async getOfferingSummaryForAEST(
    locationId: number,
    programId: number,
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    searchCriteria?: string,
    sortField?: OfferingSummaryFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<EducationProgramOfferingDto>> {
    return ApiClient.EducationProgramOffering.getOfferingSummaryForAEST(
      locationId,
      programId,
      page,
      pageCount,
      searchCriteria,
      sortField,
      sortOrder,
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
}
