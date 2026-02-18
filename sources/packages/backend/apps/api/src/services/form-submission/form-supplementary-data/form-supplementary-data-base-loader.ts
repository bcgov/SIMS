import { Injectable } from "@nestjs/common";
import {
  FormSubmissionConfig,
  KnownSupplementaryData,
  KnownSupplementaryDataKey,
} from "../form-submission.models";

@Injectable()
export abstract class SupplementaryDataBaseLoader<
  K extends KnownSupplementaryDataKey = KnownSupplementaryDataKey,
  T extends KnownSupplementaryData[K] = KnownSupplementaryData[K],
> {
  abstract get dataKey(): K;

  abstract loadSupplementaryData(
    formSubmission: FormSubmissionConfig,
    resultSupplementaryData: KnownSupplementaryData,
    studentId?: number,
  ): Promise<void>;

  abstract getSupplementaryData(
    applicationId: number | undefined,
    studentId?: number,
  ): Promise<T>;
}
