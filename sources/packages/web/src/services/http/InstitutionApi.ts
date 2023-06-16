import HttpBaseClient from "./common/HttpBaseClient";
import { PaginatedResults, PaginationOptions, PaginationParams } from "@/types";
import {
  ActiveApplicationSummaryAPIOutDTO,
  InstitutionDetailAPIOutDTO,
  InstitutionContactAPIInDTO,
  InstitutionProfileAPIInDTO,
  SearchInstitutionAPIOutDTO,
  InstitutionBasicAPIOutDTO,
  CreateInstitutionAPIInDTO,
  InstitutionLocationAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  AESTCreateInstitutionAPIInDTO,
  PrimaryIdentifierAPIOutDTO,
  OptionItemAPIOutDTO,
  ApplicationOfferingChangeSummaryAPIOutDTO,
} from "@/services/http/dto";
import {
  addPaginationOptions,
  addSortOptions,
  getPaginationQueryString,
} from "@/helpers";

export class InstitutionApi extends HttpBaseClient {
  /**
   * Create institutions that are not allowed to create the profile by
   * themselves due to limitations, for instance, when the institution
   * has only a basic BCeID login.
   * @param createInstitutionDTO complete information to create the profile.
   */
  async createInstitution(
    createInstitutionDTO: AESTCreateInstitutionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.postCall<AESTCreateInstitutionAPIInDTO>(
      this.addClientRoot("institution"),
      createInstitutionDTO,
    );
  }

  /**
   * Creates an institution during institution setup process when the
   * institution profile and the user are created and associated altogether.
   * @param createInstitutionDto information from the institution and the user.
   */
  async createInstitutionWithAssociatedUser(
    createInstitutionDto: CreateInstitutionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    return this.postCall<CreateInstitutionAPIInDTO>(
      this.addClientRoot("institution"),
      createInstitutionDto,
    );
  }

  async updateInstitution(
    data: InstitutionContactAPIInDTO | InstitutionProfileAPIInDTO,
    institutionId?: number,
  ): Promise<void> {
    const url = institutionId ? `institution/${institutionId}` : "institution";
    await this.patchCall<
      InstitutionContactAPIInDTO | InstitutionProfileAPIInDTO
    >(this.addClientRoot(url), data);
  }

  async getDetail(
    institutionId?: number,
    authHeader?: any,
  ): Promise<InstitutionDetailAPIOutDTO> {
    const url = institutionId ? `institution/${institutionId}` : "institution";
    return this.getCall<InstitutionDetailAPIOutDTO>(
      this.addClientRoot(url),
      authHeader,
    );
  }

  /**
   * Get the list os all institutions types to be returned in an option
   * list (key/value pair) schema.
   * @returns institutions types in an option list (key/value pair) schema.
   */
  async getInstitutionTypeOptions(): Promise<OptionItemAPIOutDTO[]> {
    return this.getCall(this.addClientRoot("institution/type/options-list"));
  }

  async allInstitutionLocations(
    institutionId?: number,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    const url = institutionId
      ? `institution/${institutionId}/locations`
      : "institution/locations";
    return this.getCall<InstitutionLocationAPIOutDTO[]>(
      this.addClientRoot(url),
    );
  }

  async getActiveApplicationsSummary(
    locationId: number,
    paginationOptions: PaginationOptions,
    archived: boolean,
  ): Promise<PaginatedResultsAPIOutDTO<ActiveApplicationSummaryAPIOutDTO>> {
    let url = `location/${locationId}/active-applications?archived=${archived}`;

    // Adding pagination params. There is always a default page and pageLimit for paginated APIs.
    url = addPaginationOptions(
      url,
      paginationOptions.page,
      paginationOptions.pageLimit,
      "&",
    );

    //Adding Sort params. There is always a default sortField and sortOrder for Active Applications.
    url = addSortOptions(
      url,
      paginationOptions.sortField,
      paginationOptions.sortOrder,
    );

    // Search criteria is populated only when search box has search text in it.
    if (paginationOptions.searchCriteria) {
      url = `${url}&${PaginationParams.SearchCriteria}=${paginationOptions.searchCriteria}`;
    }

    return this.getCall<PaginatedResults<ActiveApplicationSummaryAPIOutDTO>>(
      this.addClientRoot(url),
    );
  }

  async searchInstitutions(
    legalName: string,
    operatingName: string,
  ): Promise<SearchInstitutionAPIOutDTO[]> {
    let queryString = "";
    if (legalName) {
      queryString += `legalName=${legalName}&`;
    }
    if (operatingName) {
      queryString += `operatingName=${operatingName}&`;
    }
    const url = `institution/search?${queryString.slice(0, -1)}`;
    return this.getCall<SearchInstitutionAPIOutDTO[]>(this.addClientRoot(url));
  }

  async getBasicInstitutionInfoById(
    institutionId: number,
  ): Promise<InstitutionBasicAPIOutDTO> {
    return this.getCall<InstitutionBasicAPIOutDTO>(
      this.addClientRoot(`institution/${institutionId}/basic-details`),
    );
  }

  /**
   * Gets all eligible application that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @returns list of eligible application that can be requested for
   * application offering change.
   */
  async getEligibleApplicationOfferingChangeRecords(
    locationId: number,
    paginationOptions: PaginationOptions,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationOfferingChangeSummaryAPIOutDTO>
  > {
    let url = `location/${locationId}/active-applications/request-change?`;
    url += getPaginationQueryString(paginationOptions, true);
    return this.getCall<
      PaginatedResultsAPIOutDTO<ApplicationOfferingChangeSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }
}
