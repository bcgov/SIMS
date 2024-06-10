import { PaginatedResults, PaginationOptions } from "../types";
import ApiClient from "./http/ApiClient";
import {
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationFormAPIOutDTO,
  InstitutionLocationAPIOutDTO,
  ActiveApplicationDataAPIOutDTO,
  ActiveApplicationSummaryAPIOutDTO,
  InstitutionDetailAPIOutDTO,
  InstitutionContactAPIInDTO,
  SearchInstitutionAPIOutDTO,
  InstitutionBasicAPIOutDTO,
  CreateInstitutionAPIInDTO,
  InstitutionLocationAPIInDTO,
  InstitutionLocationPrimaryContactAPIInDTO,
  AESTCreateInstitutionAPIInDTO,
  PrimaryIdentifierAPIOutDTO,
  OptionItemAPIOutDTO,
  InstitutionProfileAPIInDTO,
} from "@/services/http/dto";

export class InstitutionService {
  // Share Instance
  private static instance: InstitutionService;

  static get shared(): InstitutionService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Create institutions that are not allowed to create the profile by
   * themselves due to limitations, for instance, when the institution
   * has only a basic BCeID login.
   * @param data complete information to create the profile.
   * @return created institution profile.
   */
  async createInstitution(
    data: AESTCreateInstitutionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return ApiClient.Institution.createInstitution(data);
  }

  /**
   * Create institution during institution setup process when the institution
   * profile and the user are create and associated altogether.
   * @param data information from the institution and the user.
   * @return created institution profile.
   */
  async createInstitutionWithAssociatedUser(
    data: CreateInstitutionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return ApiClient.Institution.createInstitutionWithAssociatedUser(data);
  }

  /**
   * Update institution profile details.
   * @param data institution details to be updated.
   * @param institutionId id for the institution to be updated.
   */
  async updateInstitution(
    data: InstitutionContactAPIInDTO | InstitutionProfileAPIInDTO,
    institutionId?: number,
  ): Promise<void> {
    await ApiClient.Institution.updateInstitution(data, institutionId);
  }

  async getDetail(
    institutionId?: number,
    authHeader?: any,
  ): Promise<InstitutionDetailAPIOutDTO> {
    return ApiClient.Institution.getDetail(institutionId, authHeader);
  }

  async createInstitutionLocation(data: InstitutionLocationFormAPIInDTO) {
    await ApiClient.InstitutionLocation.createInstitutionLocation(data);
  }

  async updateInstitutionLocation(
    locationId: number,
    institutionLocation:
      | InstitutionLocationPrimaryContactAPIInDTO
      | InstitutionLocationAPIInDTO,
  ): Promise<void> {
    await ApiClient.InstitutionLocation.updateInstitutionLocation(
      locationId,
      institutionLocation,
    );
  }

  async getInstitutionLocation(
    locationId: number,
  ): Promise<InstitutionLocationFormAPIOutDTO> {
    return ApiClient.InstitutionLocation.getInstitutionLocation(locationId);
  }

  async getAllInstitutionLocations(
    institutionId?: number,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    return ApiClient.Institution.allInstitutionLocations(institutionId);
  }

  async getLocationsOptionsList(): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.InstitutionLocation.getOptionsList();
  }

  /**
   * Get the list os all institutions types to be returned in an option
   * list (key/value pair) schema.
   * @returns institutions types in an option list (key/value pair) schema.
   */
  async getInstitutionTypeOptions(): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.Institution.getInstitutionTypeOptions();
  }

  async getActiveApplicationsSummary(
    locationId: number,
    paginationOptions: PaginationOptions,
    archived: boolean,
  ): Promise<PaginatedResults<ActiveApplicationSummaryAPIOutDTO>> {
    return ApiClient.Institution.getActiveApplicationsSummary(
      locationId,
      paginationOptions,
      archived,
    );
  }

  async getActiveApplication(
    applicationId: number,
    locationId: number,
  ): Promise<ActiveApplicationDataAPIOutDTO> {
    return ApiClient.InstitutionLocation.getActiveApplication(
      applicationId,
      locationId,
    );
  }

  /**
   * Search Institution for ministry search page.
   * @param legalName
   * @param operatingName
   * @returns Institution search result(s).
   */
  async searchInstitutions(
    legalName: string,
    operatingName: string,
  ): Promise<SearchInstitutionAPIOutDTO[]> {
    return ApiClient.Institution.searchInstitutions(legalName, operatingName);
  }

  /**
   * Get the Basic information of the institution for the ministry institution detail page header
   * @param institutionId
   * @returns Institution basic information.
   */
  async getBasicInstitutionInfoById(
    institutionId: number,
  ): Promise<InstitutionBasicAPIOutDTO> {
    return ApiClient.Institution.getBasicInstitutionInfoById(institutionId);
  }

  /**
   * Get location details of logged in user.
   * @returns location details.
   */
  async getMyInstitutionLocationsDetails() {
    return ApiClient.InstitutionLocation.getMyInstitutionLocationsDetails();
  }

  /**
   * Get the list os all institutions names to be returned in an option
   * list (key/value pair) schema.
   * @returns institutions names in an option list (key/value pair) schema.
   */
  async getInstitutionNameOptions(): Promise<OptionItemAPIOutDTO[]> {
    return ApiClient.Institution.getInstitutionNameOptions();
  }
}
