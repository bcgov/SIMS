import { Injectable } from "@nestjs/common";
import { SupplementaryDataBaseLoader } from ".";
import {
  FormSubmissionConfig,
  KnownSupplementaryData,
  KnownSupplementaryDataKey,
} from "../form-submission.models";
import { SupportingUser, SupportingUserType } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { getSupportingUserParents } from "apps/api/src/utilities";
import { Parent } from "../../../types";

/**
 * Loads supplementary parent data for application-scoped form submissions.
 */
@Injectable()
export class SupplementaryDataParents extends SupplementaryDataBaseLoader<KnownSupplementaryDataKey.Parents> {
  constructor(
    @InjectRepository(SupportingUser)
    private readonly supportingUserRepo: Repository<SupportingUser>,
  ) {
    super();
  }

  /**
   * The key that identifies the type of supplementary data loaded by this loader.
   * This property is used to determine which loader should be invoked to load a specific type
   * of supplementary data based on the known supplementary data keys.
   */
  get dataKey(): KnownSupplementaryDataKey.Parents {
    return KnownSupplementaryDataKey.Parents;
  }

  /**
   * Loads parents data for application-scoped form submissions.
   * @param submissionConfig form submission configuration for which the parents data should be loaded.
   * @param resultSupplementaryData object that will also be updated with the loaded parents data.
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
    if (!submissionConfig.applicationId) {
      throw new Error(
        "Application ID is required to load parents data for application-scoped forms.",
      );
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
   * Loads parents data for the given application and student.
   * @param applicationId application ID associated with the parents data.
   * @param studentId student ID associated with the parents data.
   * @returns parents data for the given application and student.
   */
  async getSupplementaryData(
    applicationId: number,
    studentId: number,
  ): Promise<Parent[]> {
    const parents = await this.supportingUserRepo.find({
      select: {
        id: true,
        fullName: true,
      },
      where: {
        supportingUserType: SupportingUserType.Parent,
        application: { id: applicationId, student: { id: studentId } },
      },
    });
    if (!parents?.length) {
      throw new Error(
        `Parents data is not available for application with ID ${applicationId}.`,
      );
    }
    return getSupportingUserParents(parents);
  }
}
