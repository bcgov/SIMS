import { IntersectionType } from "@nestjs/swagger";
import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import {
  ApplicationExceptionStatus,
  ApplicationStatus,
  OfferingIntensity,
  OfferingStatus,
  ProgramInfoStatus,
  SupportingUserType,
} from "../../../database/entities";
import { SuccessWaitingStatus } from "./application.model";
("./application.model");

export class UpdateApplicationStatusAPIInDTO {
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}

export class CRAVerificationIncomeDetailsAPIOutDTO {
  /**
   * Income manually reported by the Student in the Application.
   */
  reported: number;
  /**
   * If available, income returned from the CRA.
   */
  craReported?: number;
  /**
   * Indicates if the CRA verification is done.
   * Even after the CRA verification is executed the
   * value of the craReported can still be null,
   * for instance, when the person data is not valid or
   * when there is no tax filed for the requested year.
   */
  verifiedOnCRA: boolean;
}

export class CreateIncomeVerificationAPIInDTO {
  @IsInt()
  @Min(2000)
  taxYear: number;
  @IsInt()
  @Min(0)
  reportedIncome: number;
  @IsOptional()
  @IsInt()
  @Min(1)
  supportingUserId?: number;
}

export class CreateSupportingUsersAPIInDTO {
  @IsEnum(SupportingUserType)
  supportingUserType: SupportingUserType;
}

export class SupportingUserDetailsAPIOutDTO {
  supportingData: any;
}

export class ApplicationIncomeVerification {
  parent1IncomeVerificationStatus?: SuccessWaitingStatus;
  parent2IncomeVerificationStatus?: SuccessWaitingStatus;
  partnerIncomeVerificationStatus?: SuccessWaitingStatus;
  studentIncomeVerificationStatus?: SuccessWaitingStatus;
}

export class ApplicationSupportingUserDetails {
  parent1Info?: SuccessWaitingStatus;
  parent2Info?: SuccessWaitingStatus;
  partnerInfo?: SuccessWaitingStatus;
}

export class InProgressApplicationDetailsAPIOutDTO extends IntersectionType(
  ApplicationSupportingUserDetails,
  ApplicationIncomeVerification,
) {
  id: number;
  applicationStatus: ApplicationStatus;
  pirStatus: ProgramInfoStatus;
  pirDeniedReason?: string;
  offeringStatus?: OfferingStatus;
  exceptionStatus?: ApplicationExceptionStatus;
}
