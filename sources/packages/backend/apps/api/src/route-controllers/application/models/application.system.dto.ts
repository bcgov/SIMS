import { IntersectionType } from "@nestjs/swagger";
import {
  ApplicationExceptionStatus,
  ApplicationStatus,
  OfferingStatus,
  ProgramInfoStatus,
} from "@sims/sims-db";
import { SuccessWaitingStatus } from "./application.dto";

export class ApplicationIncomeVerificationAPIOutDTO {
  parent1IncomeVerificationStatus?: SuccessWaitingStatus;
  parent2IncomeVerificationStatus?: SuccessWaitingStatus;
  partnerIncomeVerificationStatus?: SuccessWaitingStatus;
  studentIncomeVerificationStatus?: SuccessWaitingStatus;
}

export class ApplicationSupportingUserDetailsAPIOutDTO {
  parent1Info?: SuccessWaitingStatus;
  parent2Info?: SuccessWaitingStatus;
  partnerInfo?: SuccessWaitingStatus;
}

export class InProgressApplicationDetailsAPIOutDTO extends IntersectionType(
  ApplicationSupportingUserDetailsAPIOutDTO,
  ApplicationIncomeVerificationAPIOutDTO,
) {
  id: number;
  applicationStatus: ApplicationStatus;
  pirStatus: ProgramInfoStatus;
  pirDeniedReason?: string;
  offeringStatus?: OfferingStatus;
  exceptionStatus?: ApplicationExceptionStatus;
}
