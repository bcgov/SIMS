import { AESTInstitutionProgramsSummaryDto } from "@/types";
import {
  OptionItemDto,
  DataTableSortOrder,
  PaginatedResults,
  PaginationOptions,
} from "../types";
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
} from "@/services/http/dto";

export class InstitutionService {
  // Share Instance
  private static instance: InstitutionService;

  public static get shared(): InstitutionService {
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

  public async updateInstitution(
    data: InstitutionContactAPIInDTO,
    institutionId?: number,
  ): Promise<void> {
    await ApiClient.Institution.updateInstitution(data, institutionId);
  }

  public async getDetail(
    institutionId?: number,
    authHeader?: any,
  ): Promise<InstitutionDetailAPIOutDTO> {
    return ApiClient.Institution.getDetail(institutionId, authHeader);
  }

  public async createInstitutionLocation(
    data: InstitutionLocationFormAPIInDTO,
  ) {
    await ApiClient.InstitutionLocation.createInstitutionLocation(data);
  }

  public async updateInstitutionLocation(
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

  public async getInstitutionLocation(
    locationId: number,
  ): Promise<InstitutionLocationFormAPIOutDTO> {
    return ApiClient.InstitutionLocation.getInstitutionLocation(locationId);
  }

  public async getAllInstitutionLocations(
    institutionId?: number,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    return ApiClient.Institution.allInstitutionLocations(institutionId);
  }

  public async getLocationsOptionsList(): Promise<OptionItemDto[]> {
    return ApiClient.InstitutionLocation.getOptionsList();
  }

  public async getInstitutionTypeOptions(): Promise<OptionItemDto[]> {
    return ApiClient.Institution.getInstitutionTypeOptions();
  }

  public async getActiveApplicationsSummary(
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

  public async getActiveApplication(
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
   * Get the Institution programs summary for the ministry institution detail page
   * @param institutionId
   * @returns PaginatedResults<AESTInstitutionProgramsSummaryDto>
   */
  async getPaginatedAESTInstitutionProgramsSummary(
    institutionId: number,
    pageSize: number,
    page: number,
    searchCriteria: string,
    sortColumn?: string,
    sortOrder?: DataTableSortOrder,
  ): Promise<PaginatedResults<AESTInstitutionProgramsSummaryDto>> {
    return ApiClient.Institution.getPaginatedAESTInstitutionProgramsSummary(
      institutionId,
      pageSize,
      page,
      searchCriteria,
      sortColumn,
      sortOrder,
    );
  }

  /**
   * Get location details of logged in user.
   * @returns location details.
   */
  async getMyInstitutionLocationsDetails() {
    return ApiClient.InstitutionLocation.getMyInstitutionLocationsDetails();
  }
}
