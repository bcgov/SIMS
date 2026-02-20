import { Injectable } from "@nestjs/common";
import { SupplementaryDataBaseLoader } from ".";
import {
  FormSubmissionConfig,
  KnownSupplementaryData,
  KnownSupplementaryDataKey,
} from "../form-submission.models";
import { Application } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class SupplementaryDataProgramYear extends SupplementaryDataBaseLoader<KnownSupplementaryDataKey.ProgramYear> {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {
    super();
  }

  /**
   * The key that identifies the type of supplementary data loaded by this loader.
   * This property is used to determine which loader should be invoked to load a specific type
   * of supplementary data based on the known supplementary data keys.
   */
  get dataKey(): KnownSupplementaryDataKey.ProgramYear {
    return KnownSupplementaryDataKey.ProgramYear;
  }

  /**
   * Loads program year data for application-scoped form submissions.
   * @param submissionConfig form submission configuration for which the program year data should be loaded.
   * @param resultSupplementaryData object that will also be updated with the loaded program year data.
   * @param studentId student ID associated with the form submission.
   * @returns program year data for the given application and student.
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
        "Application ID is required to load program year data for application-scoped forms.",
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
   * Loads program year data for the given application and student.
   * @param applicationId application ID associated with the program year data.
   * @param studentId student ID associated with the program year data.
   * @returns program year data for the given application and student.
   */
  async getSupplementaryData(
    applicationId: number,
    studentId: number,
  ): Promise<string> {
    const application = await this.applicationRepo.findOne({
      select: {
        id: true,
        programYear: {
          id: true,
          programYear: true,
        },
      },
      relations: {
        programYear: true,
      },
      where: { id: applicationId, student: { id: studentId } },
    });
    if (!application?.programYear?.programYear) {
      throw new Error(
        `Program year data is not available for application with ID ${applicationId}.`,
      );
    }
    return application.programYear.programYear;
  }
}
