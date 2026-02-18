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

  get dataKey(): KnownSupplementaryDataKey.ProgramYear {
    return KnownSupplementaryDataKey.ProgramYear;
  }

  async loadSupplementaryData(
    submissionConfig: FormSubmissionConfig,
    resultSupplementaryData: KnownSupplementaryData,
    studentId?: number,
  ): Promise<void> {
    if (!submissionConfig.hasApplicationScope) {
      // Program year data is only relevant for application-scoped forms,
      // so we can skip loading if it's not application-scoped.
      return;
    }
    if (!submissionConfig.applicationId) {
      throw new Error(
        "Application ID is required to load program year data for application-scoped forms.",
      );
    }
    if (!resultSupplementaryData[KnownSupplementaryDataKey.ProgramYear]) {
      resultSupplementaryData[KnownSupplementaryDataKey.ProgramYear] =
        await this.getSupplementaryData(
          submissionConfig.applicationId,
          studentId,
        );
    }
    submissionConfig.formData[KnownSupplementaryDataKey.ProgramYear] =
      resultSupplementaryData[KnownSupplementaryDataKey.ProgramYear];
  }

  async getSupplementaryData(
    applicationId: number,
    studentId?: number,
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
