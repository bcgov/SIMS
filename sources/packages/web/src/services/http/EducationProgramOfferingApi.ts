import HttpBaseClient from "./common/HttpBaseClient";
import {
  OptionItemDto,
  OfferingIntensity,
  OfferingDTO,
  ProgramOfferingDetailsDto,
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_LIMIT,
  OfferingSummaryFields,
  DataTableSortOrder,
  FieldSortOrder,
  PaginatedResults,
  EducationProgramOfferingDto,
} from "@/types";

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

  /**
   * To get the offering summary
   * @param locationId, location id
   * @param programId, program id
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageLimit, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param searchName, user's name keyword to be searched
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns offering summary.
   */
  public async getAllEducationProgramOffering(
    locationId: number,
    programId: number,
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    searchName?: string,
    sortField?: OfferingSummaryFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<EducationProgramOfferingDto>> {
    try {
      let URL = `institution/offering/location/${locationId}/education-program/${programId}?page=${page}&pageLimit=${pageCount}`;
      if (searchName) {
        URL = `${URL}&searchName=${searchName}`;
      }
      if (sortField && sortOrder) {
        const sortDBOrder =
          sortOrder === DataTableSortOrder.DESC
            ? FieldSortOrder.DESC
            : FieldSortOrder.ASC;
        URL = `${URL}&sortField=${sortField}&sortOrder=${sortDBOrder}`;
      }
      const response = await this.apiClient.get(URL, this.addAuthHeader());
      return response.data;
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
    programYearId: number,
    selectedIntensity: OfferingIntensity,
    includeInActivePY?: boolean,
  ): Promise<OptionItemDto[]> {
    try {
      let url = `institution/offering/location/${locationId}/education-program/${programId}/program-year/${programYearId}/options-list`;
      url = `${url}?selectedIntensity=${selectedIntensity}`;
      if (includeInActivePY) {
        url = `${url}&includeInActivePY=${includeInActivePY}`;
      }
      const response = await this.getCall(url);
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Gets program offering details
   * @param offeringId offering id
   * @returns offering details for the given offering
   */
  public async getProgramOfferingDetails(
    offeringId: number,
  ): Promise<ProgramOfferingDetailsDto> {
    try {
      const response = await this.apiClient.get(
        `institution/offering/${offeringId}`,
        this.addAuthHeader(),
      );
      return response.data as ProgramOfferingDetailsDto;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
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
    includeInActivePY?: boolean,
  ): Promise<OptionItemDto[]> {
    try {
      let url = `institution/offering/location/${locationId}/education-program/${programId}/program-year/${programYearId}/offerings-list`;
      if (includeInActivePY) {
        url = `${url}?includeInActivePY=${includeInActivePY}`;
      }
      const response = await this.getCall(url);
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * To get the offering summary for ministry users
   * @param locationId, location id
   * @param programId, program id
   * @param page, page number if nothing is passed then
   * DEFAULT_PAGE_NUMBER is taken
   * @param pageLimit, limit of the page if nothing is
   * passed then DEFAULT_PAGE_LIMIT is taken
   * @param searchName, user's name keyword to be searched
   * @param sortField, field to be sorted
   * @param sortOrder, order to be sorted
   * @returns offering summary.
   */
  public async getOfferingSummaryForAEST(
    locationId: number,
    programId: number,
    page = DEFAULT_PAGE_NUMBER,
    pageCount = DEFAULT_PAGE_LIMIT,
    searchName?: string,
    sortField?: OfferingSummaryFields,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<EducationProgramOfferingDto>> {
    try {
      let URL = `institution/offering/location/${locationId}/education-program/${programId}/aest?page=${page}&pageLimit=${pageCount}`;
      if (searchName) {
        URL = `${URL}&searchName=${searchName}`;
      }
      if (sortField && sortOrder) {
        const sortDBOrder =
          sortOrder === DataTableSortOrder.DESC
            ? FieldSortOrder.DESC
            : FieldSortOrder.ASC;
        URL = `${URL}&sortField=${sortField}&sortOrder=${sortDBOrder}`;
      }
      const response = await this.apiClient.get(URL, this.addAuthHeader());
      return response.data;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  /**
   * Offering details for ministry users
   * @param offeringId offering id
   * @returns Offering details
   */
  public async getProgramOfferingForAEST(
    offeringId: number,
  ): Promise<OfferingDTO> {
    try {
      const response = await this.apiClient.get(
        `institution/offering/${offeringId}/aest`,
        this.addAuthHeader(),
      );
      return response.data as OfferingDTO;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
