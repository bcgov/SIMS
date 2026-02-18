import { Injectable } from "@nestjs/common";
import {
  FormSubmissionConfig,
  KnownSupplementaryData,
  KnownSupplementaryDataKey,
} from "../form-submission.models";

/**
 * Loads supplementary data for form submissions based on the form dynamic data properties.
 * Each loader is responsible for a specific type of supplementary data, identified by its dataKey.
 */
@Injectable()
export abstract class SupplementaryDataBaseLoader<
  K extends KnownSupplementaryDataKey = KnownSupplementaryDataKey,
  T extends KnownSupplementaryData[K] = KnownSupplementaryData[K],
> {
  /**
   * The key that identifies the type of supplementary data loaded by this loader.
   * This property is used to determine which loader should be invoked to load a specific type
   * of supplementary data based on the known supplementary data keys.
   */
  abstract get dataKey(): K;

  /**
   * Loads the supplementary data into the form submission and updates the result object.
   * @param submissionConfig form submission configuration for which the supplementary data should be loaded.
   * @param resultSupplementaryData object that will also be updated with the loaded supplementary data.
   * The loader should add a new property to this object using its dataKey, and assign the loaded data to that property.
   * The resultSupplementaryData object is shared among all loaders, so they can load different pieces of supplementary
   * data and add them to the same result object allowing a previously loaded data to be used by a subsequent loader if needed.
   * @param studentId non-mandatory student ID associated with the form submission.
   */
  async loadSupplementaryData(
    submissionConfig: FormSubmissionConfig,
    resultSupplementaryData: KnownSupplementaryData,
    studentId: number | undefined,
  ): Promise<void> {
    if (!resultSupplementaryData[this.dataKey]) {
      resultSupplementaryData[this.dataKey] = await this.getSupplementaryData(
        submissionConfig.applicationId,
        studentId,
      );
    }
  }

  /**
   * Retrieves the supplementary data for the given application and student.
   * The data retrieved by this method acts as a centralized source of truth for the supplementary data associated with
   * the form submission, and should be used to populate the form when the user is filling it out for submission.
   * @param applicationId non-mandatory application ID associated with the supplementary data.
   * @param studentId non-mandatory student ID associated with the supplementary data.
   */
  abstract getSupplementaryData(
    applicationId: number | undefined,
    studentId: number | undefined,
  ): Promise<T>;

  /**
   * Indicates if the form dynamic data has a property corresponding to the dataKey of this loader,
   * which is used to determine if the loader should be executed for a given form submission configuration.
   * @param submissionConfig form submission configuration to check for the presence of the dataKey property.
   * @returns true if the form dynamic data has a property corresponding to the dataKey of this loader, false otherwise.
   */
  protected hasDataKeyProperty(
    submissionConfig: FormSubmissionConfig,
  ): boolean {
    return submissionConfig.formData[this.dataKey] !== undefined;
  }
}
