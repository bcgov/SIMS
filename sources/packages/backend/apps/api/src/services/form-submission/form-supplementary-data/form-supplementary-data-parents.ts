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

  get dataKey(): KnownSupplementaryDataKey.Parents {
    return KnownSupplementaryDataKey.Parents;
  }

  async loadSupplementaryData(
    submissionConfig: FormSubmissionConfig,
    resultSupplementaryData: KnownSupplementaryData,
    studentId?: number,
  ): Promise<void> {
    if (!submissionConfig.hasApplicationScope) {
      // Parents data is only relevant for application-scoped forms,
      // so we can skip loading if it's not application-scoped.
      return;
    }
    if (!submissionConfig.applicationId) {
      throw new Error(
        "Application ID is required to load parents data for application-scoped forms.",
      );
    }
    if (!resultSupplementaryData[KnownSupplementaryDataKey.Parents]) {
      resultSupplementaryData[KnownSupplementaryDataKey.Parents] =
        await this.getSupplementaryData(
          submissionConfig.applicationId,
          studentId,
        );
    }
    submissionConfig.formData[KnownSupplementaryDataKey.Parents] =
      resultSupplementaryData[KnownSupplementaryDataKey.Parents];
  }

  async getSupplementaryData(
    applicationId: number,
    studentId?: number,
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
