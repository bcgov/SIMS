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
  PaginatedResults,
  EducationProgramOfferingDto,
} from "@/types";
import { addSortOptions } from "@/helpers";
import {
  OfferingAssessmentAPIInDTO,
  OfferingChangeRequestAPIOutDTO,
  PrecedingOfferingSummaryAPIOutDTO,
  OfferingChangeAssessmentAPIInDTO,
} from "@/services/http/dto";
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
    try {
      let url = `institution/offering/location/${locationId}/education-program/${programId}?page=${page}&pageLimit=${pageCount}`;
      if (searchCriteria) {
        url = `${url}&searchCriteria=${searchCriteria}`;
      }
      url = addSortOptions(url, sortField, sortOrder);

      const response = await this.getCall(url);
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
    offeringIntensity: OfferingIntensity,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<OptionItemDto[]> {
    try {
      let url = `institution/offering/location/${locationId}/education-program/${programId}/program-year/${programYearId}/options-list`;
      url = `${url}?offeringIntensity=${offeringIntensity}`;
      if (isIncludeInActiveProgramYear) {
        url = `${url}&isIncludeInActiveProgramYear=${isIncludeInActiveProgramYear}`;
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
    selectedOfferingIntensity: OfferingIntensity,
    isIncludeInActiveProgramYear?: boolean,
  ): Promise<OptionItemDto[]> {
    try {
      let url = `institution/offering/location/${locationId}/education-program/${programId}/program-year/${programYearId}/offerings-list?offeringIntensity=${selectedOfferingIntensity}`;
      if (isIncludeInActiveProgramYear) {
        url = `${url}&isIncludeInActiveProgramYear=${isIncludeInActiveProgramYear}`;
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
   * @param searchCriteria,keyword to be searched
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
    try {
      let url = `institution/offering/location/${locationId}/education-program/${programId}/aest?page=${page}&pageLimit=${pageCount}`;
      if (searchCriteria) {
        url = `${url}&searchCriteria=${searchCriteria}`;
      }

      url = addSortOptions(url, sortField, sortOrder);
      const response = await this.getCall(url);
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

  /**
   * Assess an offering to approve or decline.
   * @param offeringId
   * @param payload
   */
  public async assessOffering(
    offeringId: number,
    payload: OfferingAssessmentAPIInDTO,
  ): Promise<void> {
    await this.patchCall<OfferingAssessmentAPIInDTO>(
      this.addClientRoot(`institution/offering/${offeringId}/assess`),
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
    await this.postCall<OfferingDTO>(
      `institution/offering/${offeringId}/location/${locationId}/education-program/${programId}/request-change`,
      payload,
    );
  }

  /**
   * Get all offerings that were requested for change.
   * @returns all offerings that were requested for change.
   */
  async getOfferingChangeRequests(): Promise<OfferingChangeRequestAPIOutDTO[]> {
    return this.getCallTyped<OfferingChangeRequestAPIOutDTO[]>(
      this.addClientRoot("institution/offering/change-requests"),
    );
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
    return this.getCallTyped<PrecedingOfferingSummaryAPIOutDTO>(
      this.addClientRoot(
        `institution/offering/${offeringId}/preceding-offering-summary`,
      ),
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
    return this.getCallTyped<OfferingDTO>(
      this.addClientRoot(
        `institution/offering/${offeringId}/preceding-offering`,
      ),
    );
  }

  async assessOfferingChangeRequest(
    offeringId: number,
    payload: OfferingChangeAssessmentAPIInDTO,
  ): Promise<void> {
    await this.patchCall<OfferingChangeAssessmentAPIInDTO>(
      this.addClientRoot(
        `institution/offering/${offeringId}/assess-change-request`,
      ),
      payload,
    );
  }
}
