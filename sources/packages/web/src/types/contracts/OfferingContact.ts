import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { EducationProgramOfferingAPIOutDTO } from "@/services/http/dto";
import { OfferingStatus } from "@/types";

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
  offeringChipStatus?: StatusChipTypes;
  offeringStatusToDisplay?: OfferingStatus;
  mode: OfferingFormModes;
};

/**
 * Offering form base model which consists of properties excluding the values derived at client.
 */
export type OfferingFormBaseModel = Omit<
  OfferingFormModel,
  "offeringChipStatus" | "offeringStatusToDisplay"
>;

/**
 * Offering form create model which consists of program related properties to
 * validate offering on creation.
 */
export type OfferingFormCreateModel = Pick<OfferingFormModel, "mode">;

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

/**
 * Possible modes that the student profile form
 * can be adapted for different scenarios supported.
 */
export enum OfferingFormModes {
  /**
   * All controls are available to be edited.
   */
  Editable = "editable",
  /**
   * Form is completely readonly.
   */
  Readonly = "readonly",
  /**
   * All assessment related components are readonly.
   * Offerings already associated with some assessment are no longer
   * open for modifications with exception of fields like "Offering Name"
   * that will not impact the assessment calculation.
   */
  AssessmentDataReadonly = "assessment-data-readonly",
}

/**
 * Possible operations executed on an offering that will generate
 * data submission that will create, update or clone it.
 */
export enum OfferingSubmitModes {
  /**
   * Create a new offering.
   */
  Create = "create",
  /**
   * Offering update. Allowed when the offering was created and no
   * assessments are using it yet.
   */
  Update = "update",
  /**
   * Once an offering is already associated with some assessment
   * and no longer can be directly edited.
   */
  ChangeRequest = "change-request",
}
