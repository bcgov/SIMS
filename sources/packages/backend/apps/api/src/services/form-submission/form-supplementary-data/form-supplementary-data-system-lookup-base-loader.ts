import { Injectable } from "@nestjs/common";
import { SystemLookupCategory } from "@sims/sims-db";
import { SystemLookupConfigurationService } from "@sims/services/system-lookup-configuration";
import { SupplementaryDataBaseLoader } from ".";
import {
  FormSubmissionConfig,
  KnownSupplementaryData,
  KnownSupplementaryDataKey,
} from "../form-submission.models";
import { SystemLookupItem } from "../../../types";

/**
 * Supplementary data keys that are loaded from a system lookup category.
 */
type SystemLookupSupplementaryDataKey = {
  [K in KnownSupplementaryDataKey]: KnownSupplementaryData[K] extends
    | SystemLookupItem[]
    | undefined
    ? K
    : never;
}[KnownSupplementaryDataKey];

/**
 * Loads supplementary data from the system lookup configurations of a category.
 * The data is not specific to a student or an application.
 */
@Injectable()
export abstract class SupplementaryDataSystemLookupBaseLoader<
  K extends SystemLookupSupplementaryDataKey,
> extends SupplementaryDataBaseLoader<K, SystemLookupItem[]> {
  constructor(
    private readonly systemLookupConfigurationService: SystemLookupConfigurationService,
  ) {
    super();
  }

  /**
   * System lookup category that provides the supplementary data.
   */
  protected abstract get lookupCategory(): SystemLookupCategory;

  /**
   * Loads the system lookup items for the form submissions that have the data key property.
   * @param submissionConfig form submission configuration for which the items should be loaded.
   * @param resultSupplementaryData object that will also be updated with the loaded items.
   * @param studentId student ID associated with the form submission.
   */
  async loadSupplementaryData(
    submissionConfig: FormSubmissionConfig,
    resultSupplementaryData: KnownSupplementaryData,
    studentId: number,
  ): Promise<void> {
    if (!this.hasDataKeyProperty(submissionConfig)) {
      return;
    }
    await super.loadSupplementaryData(
      submissionConfig,
      resultSupplementaryData,
      studentId,
    );
    submissionConfig.formData[this.dataKey] =
      resultSupplementaryData[this.dataKey];
  }

  /**
   * Gets the system lookup items of the category, ordered by the system lookup configuration.
   * @returns system lookup items of the category.
   */
  async getSupplementaryData(): Promise<SystemLookupItem[]> {
    return this.systemLookupConfigurationService
      .getLookupByCategory(this.lookupCategory)
      .map((lookup) => ({
        lookupKey: lookup.lookupKey,
        lookupValue: lookup.lookupValue,
      }));
  }
}
