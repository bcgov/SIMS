import { Injectable } from "@nestjs/common";
import {
  FormSubmissionConfig,
  KnownSupplementaryData,
  KnownSupplementaryDataKey,
} from "../form-submission.models";
import {
  SupplementaryDataParents,
  SupplementaryDataProgramYear,
  SupplementaryDataBaseLoader,
} from ".";

/**
 * Consolidates all data loaders for form submission supplementary data.
 * Any supplementary data required by the forms should be loaded through this service,
 * which will delegate to the appropriate loader based on the known supplementary data keys.
 * New data loaders can be created by implementing the {@see SupplementaryDataBaseLoader} interface
 * and adding them to the constructor of this service.
 */
@Injectable()
export class SupplementaryDataLoader {
  private readonly dataLoaders: SupplementaryDataBaseLoader[];

  constructor(
    private readonly supplementaryDataParents: SupplementaryDataParents,
    private readonly supplementaryDataProgramYear: SupplementaryDataProgramYear,
  ) {
    this.dataLoaders = [
      this.supplementaryDataParents,
      this.supplementaryDataProgramYear,
    ];
  }

  /**
   * Associate supplementary data with the provided form submissions by invoking
   * the appropriate data loaders based on the known supplementary data keys.
   * @param formSubmissions form submissions to load supplementary data for,
   * if necessary.
   * @param studentId student ID used for authorization purposes, when required.
   */
  async loadSupplementaryData(
    formSubmissions: FormSubmissionConfig[],
    studentId?: number,
  ): Promise<void> {
    // Shared object to accumulate loaded supplementary data across multiple loaders,
    // avoiding the same data being loaded multiple times for different form submissions.
    const supplementaryData: KnownSupplementaryData = {};
    for (const submissionConfig of formSubmissions) {
      // Execute all loaders in parallel for the current form submission config.
      // Execute the submissions in sequence to allow the data to be reused.
      const loaderPromises = this.dataLoaders.map((loader) =>
        loader.loadSupplementaryData(
          submissionConfig,
          supplementaryData,
          studentId,
        ),
      );
      await Promise.all(loaderPromises);
    }
  }

  /**
   * Get supplementary data for the provided known supplementary data keys.
   * @param KnownSupplementaryDataKeys supplementary data to load.
   * @param applicationId application ID to load application-scoped supplementary data for, if necessary.
   * @param studentId student ID used for authorization purposes, when required.
   * @returns loaded supplementary data for the provided known supplementary data keys and application ID.
   */
  async getSupplementaryData(
    KnownSupplementaryDataKeys: KnownSupplementaryDataKey[],
    applicationId: number | undefined,
    studentId: number | undefined,
  ): Promise<KnownSupplementaryData> {
    const supplementaryData: KnownSupplementaryData = {};
    // Load all supplementary data in parallel.
    const supplementaryDataPromises = KnownSupplementaryDataKeys.map(
      async (dataKey) =>
        this.getSupplementaryDataInternal(dataKey, applicationId, studentId),
    );
    const loadedData = await Promise.all(supplementaryDataPromises);
    // Populate the dynamic keys of the supplementary data object with the loaded data.
    for (const { key, data } of loadedData) {
      supplementaryData[key] = data as never;
    }
    return supplementaryData;
  }

  /**
   * Retrieves supplementary data for the given data key.
   * @param dataKey key identifying the type of supplementary data to retrieve.
   * @param applicationId application ID to load application-scoped supplementary data for, if necessary.
   * @param studentId student ID used for authorization purposes, when required.
   * @returns an object containing the loaded supplementary data and its corresponding key.
   */
  private async getSupplementaryDataInternal(
    dataKey: KnownSupplementaryDataKey,
    applicationId: number | undefined,
    studentId: number | undefined,
  ): Promise<{
    data: KnownSupplementaryData[KnownSupplementaryDataKey];
    key: KnownSupplementaryDataKey;
  }> {
    const loader = this.dataLoaders.find(
      (loader) => loader.dataKey === dataKey,
    );
    if (!loader) {
      throw new Error(`No supplementary data loader found for key: ${dataKey}`);
    }
    const data = await loader.getSupplementaryData(applicationId, studentId);
    return {
      data,
      key: dataKey,
    };
  }
}
