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
    const promises: Promise<void>[] = [];
    for (const submissionConfig of formSubmissions) {
      promises.push(
        ...this.dataLoaders.map((loader) =>
          loader.loadSupplementaryData(
            submissionConfig,
            supplementaryData,
            studentId,
          ),
        ),
      );
    }
    await Promise.all(promises);
  }

  /**
   * Get supplementary data for the provided known supplementary data keys and application ID.
   * The application ID is used to load supplementary data that is scoped to an application, such as parents and program year.
   * The known supplementary data keys are used to determine which supplementary data loaders to invoke to load the necessary data.
   * @param KnownSupplementaryDataKeys supplementary data to load.
   * @param applicationId application ID to load application-scoped supplementary data for, if necessary.
   * @param studentId student ID used for authorization purposes, when required.
   * @returns loaded supplementary data for the provided known supplementary data keys and application ID.
   */
  async getSupplementaryData(
    KnownSupplementaryDataKeys: KnownSupplementaryDataKey[],
    applicationId: number | undefined,
    studentId?: number,
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

  private async getSupplementaryDataInternal(
    dataKey: KnownSupplementaryDataKey,
    applicationId: number | undefined,
    studentId?: number,
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
