import { Injectable } from "@nestjs/common";
import { SystemLookupCategory } from "@sims/sims-db";
import { SystemLookupConfigurationService } from "@sims/services/system-lookup-configuration";
import { SupplementaryDataBaseLoader } from ".";
import {
  FormSubmissionConfig,
  KnownSupplementaryData,
  KnownSupplementaryDataKey,
} from "../form-submission.models";
import { UnderservedCommunity } from "../../../types";

@Injectable()
export class SupplementaryDataUnderservedCommunities extends SupplementaryDataBaseLoader<KnownSupplementaryDataKey.UnderservedCommunities> {
  constructor(
    private readonly systemLookupConfigurationService: SystemLookupConfigurationService,
  ) {
    super();
  }

  /**
   * The key that identifies the type of supplementary data loaded by this loader.
   * This property is used to determine which loader should be invoked to load a specific type
   * of supplementary data based on the known supplementary data keys.
   */
  get dataKey(): KnownSupplementaryDataKey.UnderservedCommunities {
    return KnownSupplementaryDataKey.UnderservedCommunities;
  }

  /**
   * Loads the underserved communities for the form submissions that have the underserved communities property.
   * @param submissionConfig form submission configuration for which the communities should be loaded.
   * @param resultSupplementaryData object that will also be updated with the loaded underserved communities.
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
   * Gets the underserved communities from the system lookup configurations.
   * Underserved communities are not specific to a student or an application.
   * @returns underserved communities ordered by the system lookup configuration.
   */
  async getSupplementaryData(): Promise<UnderservedCommunity[]> {
    return this.systemLookupConfigurationService
      .getLookupByCategory(SystemLookupCategory.UnderservedCommunity)
      .map((lookup) => ({
        lookupKey: lookup.lookupKey,
        lookupValue: lookup.lookupValue,
      }));
  }
}
