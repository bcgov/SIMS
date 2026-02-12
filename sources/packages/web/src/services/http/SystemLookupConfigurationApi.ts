import { SystemLookupCategory } from "@/types";
import HttpBaseClient from "./common/HttpBaseClient";
import { SystemLookupEntriesAPIOutDTO } from "@/services/http/dto";

export class SystemLookupConfigurationApi extends HttpBaseClient {
  /**
   * Get system lookup entries by category.
   * @param lookupCategory lookup category.
   * @returns system lookup entries.
   */
  async getSystemLookupEntriesByCategory(
    lookupCategory: SystemLookupCategory,
  ): Promise<SystemLookupEntriesAPIOutDTO> {
    return this.getCall(
      `system-lookup-configuration/lookup-category/${lookupCategory}`,
    );
  }
}
