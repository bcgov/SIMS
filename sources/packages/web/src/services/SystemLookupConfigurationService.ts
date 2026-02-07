import ApiClient from "@/services/http/ApiClient";
import { SystemLookupEntriesAPIOutDTO } from "@/services/http/dto";
import { SystemLookupCategory } from "@/types";

export class SystemLookupConfigurationService {
  // Shared instance.
  private static instance: SystemLookupConfigurationService;

  static get shared(): SystemLookupConfigurationService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get system lookup entries by category.
   * @param lookupCategory lookup category.
   * @returns system lookup entries.
   */
  async getSystemLookupEntriesByCategory(
    lookupCategory: SystemLookupCategory,
  ): Promise<SystemLookupEntriesAPIOutDTO> {
    return ApiClient.SystemLookupConfigurationApi.getSystemLookupEntriesByCategory(
      lookupCategory,
    );
  }
}
