import { Injectable } from "@nestjs/common";
import { SupplementaryDataBaseLoader } from ".";
import {
  FormSubmissionConfig,
  KnownSupplementaryData,
  KnownSupplementaryDataKey,
} from "../form-submission.models";
import {
  Application,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApplicationWithdrawals } from "apps/api/src/types";

@Injectable()
export class SupplementaryDataScholasticStandingWithdrawals extends SupplementaryDataBaseLoader<KnownSupplementaryDataKey.ScholasticStandingWithdrawals> {
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
  get dataKey(): KnownSupplementaryDataKey.ScholasticStandingWithdrawals {
    return KnownSupplementaryDataKey.ScholasticStandingWithdrawals;
  }

  /**
   * Loads scholastic standing withdrawals data for application-scoped form submissions.
   * @param submissionConfig form submission configuration for which the scholastic standing withdrawals data should be loaded.
   * @param resultSupplementaryData object that will also be updated with the loaded scholastic standing withdrawals data.
   * @param studentId student ID associated with the form submission.
   * @returns scholastic standing withdrawals data for the given application and student.
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
   * Loads scholastic standing info data for all the eligible applications for a given student.
   * @param studentId student ID associated with the scholastic standing info data.
   * @returns scholastic standing info data for the given student.
   */
  async getSupplementaryData(
    _applicationId: number | undefined,
    studentId: number,
  ): Promise<ApplicationWithdrawals[]> {
    const withdrawalScholasticStandings = await this.applicationRepo
      .createQueryBuilder("application")
      .addSelect("application.applicationNumber", "applicationNumber")
      .addSelect("scholasticStanding.id", "scholasticStandingId")
      .innerJoin("application.student", "student")
      .innerJoin("application.studentAssessments", "assessment")
      .innerJoin("assessment.studentScholasticStanding", "scholasticStanding")
      .where("student.id = :studentId", { studentId })
      .andWhere("scholasticStanding.changeType = :changeType", {
        changeType:
          StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
      })
      .andWhere("scholasticStanding.reversalDate IS NULL")
      .getRawMany<{
        applicationNumber: string;
        scholasticStandingId: string;
      }>();

    const scholasticStandingByApplication = [];
    for (const withdrawalScholasticStanding of withdrawalScholasticStandings) {
      scholasticStandingByApplication.push({
        applicationNumber: withdrawalScholasticStanding.applicationNumber,
        scholasticStandingId: Number(
          withdrawalScholasticStanding.scholasticStandingId,
        ),
      });
    }
    return scholasticStandingByApplication;
  }
}
