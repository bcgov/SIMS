import { EducationProgramOfferingAPIOutDTO } from "@/services/http/dto";
import {
  ClientIdType,
  OfferingStatus,
  ProgramIntensity,
  ProgramDeliveryTypes,
} from "@/types";

/**
 * Valid Intensity of the Offerings.
 */
export enum OfferingIntensity {
  /**
   * Program with ProgramIntensity = partTime, will be Part Time
   */
  partTime = "Part Time",
  /**
   *  Program with ProgramIntensity = fullTime, will be Full Time
   */
  fullTime = "Full Time",
}

/**
 * Education program offering form.io model.
 */
export type OfferingFormModel = EducationProgramOfferingAPIOutDTO & {
  /**
   * Education program intensity. Used to perform offering validations.
   */
  programIntensity: ProgramIntensity;
  /**
   * Education program delivery type. Used to perform offering validations.
   */
  programDeliveryTypes: ProgramDeliveryTypes;
  /**
   * Indicates if the education program has WIL(work-integrated learning).
   * Used to perform offering validations.
   */
  hasWILComponent: string;
  clientType?: ClientIdType;
  offeringStatusToDisplay: OfferingStatus;
  hasExistingApplication?: boolean;
};

/**
 * Offering form base model which consists of properties excluding the values derived at client.
 */
export type OfferingFormBaseModel = Omit<
  OfferingFormModel,
  "offeringChipStatus" | "offeringStatusToDisplay" | "clientType"
>;

/**
 * Offering form create model which consists of program related properties to
 * validate offering on creation.
 */
export type OfferingFormCreateModel = Pick<
  OfferingFormModel,
  "programIntensity" | "programDeliveryTypes" | "hasWILComponent"
>;

/**
 * Dto for study break item.
 */
export interface StudyBreak {
  breakStartDate: Date;
  breakEndDate: Date;
}
/**
 * Interface for study breaks with funded and unfunded weeks properties.
 */
export interface StudyBreaksAndWeeks {
  studyBreaks: StudyBreak[];
  fundedStudyPeriodDays: number;
  totalDays: number;
  totalFundedWeeks: number;
  unfundedStudyPeriodDays: number;
}

export enum OfferingRelationType {
  ActualOffering = "Actual offering",
  PrecedingOffering = "Preceding offering",
}
