import { RestrictionCode } from "@sims/services";
import {
  DisabilityStatus,
  DisbursementSchedule,
  DisbursementValueType,
  EducationProgramOffering,
  RestrictionActionType,
  RestrictionBypassBehaviors,
  StudentRestriction,
} from "@sims/sims-db";

export interface DisbursementValue {
  valueCode: string;
  valueType: DisbursementValueType;
  valueAmount: number;
}

export interface Disbursement {
  disbursementDate: Date;
  negotiatedExpiryDate: Date;
  disbursements: DisbursementValue[];
}

export interface ECertDisbursementSchedule extends DisbursementSchedule {
  stopFullTimeBCFunding: boolean;
}

/**
 * Full time disbursement feedback errors, there are 96 FT feedback errors.
 * Todo:  As part of this ticket plan is to keep it as a const, In future we will
 * need to save these codes (both FT and PT) in DB. We have a placeholder
 * ticket created for it.
 */
export const FULL_TIME_DISBURSEMENT_FEEDBACK_ERRORS = [
  "EDU-00010",
  "EDU-00011",
  "EDU-00012",
  "EDU-00013",
  "EDU-00014",
  "EDU-00015",
  "EDU-00016",
  "EDU-00017",
  "EDU-00018",
  "EDU-00019",
  "EDU-00020",
  "EDU-00021",
  "EDU-00022",
  "EDU-00023",
  "EDU-00024",
  "EDU-00025",
  "EDU-00026",
  "EDU-00027",
  "EDU-00028",
  "EDU-00029",
  "EDU-00030",
  "EDU-00031",
  "EDU-00032",
  "EDU-00033",
  "EDU-00034",
  "EDU-00035",
  "EDU-00036",
  "EDU-00037",
  "EDU-00038",
  "EDU-00040",
  "EDU-00041",
  "EDU-00042",
  "EDU-00043",
  "EDU-00044",
  "EDU-00045",
  "EDU-00046",
  "EDU-00047",
  "EDU-00048",
  "EDU-00049",
  "EDU-00050",
  "EDU-00051",
  "EDU-00052",
  "EDU-00053",
  "EDU-00054",
  "EDU-00055",
  "EDU-00056",
  "EDU-00057",
  "EDU-00058",
  "EDU-00059",
  "EDU-00060",
  "EDU-00061",
  "EDU-00062",
  "EDU-00064",
  "EDU-00070",
  "EDU-00071",
  "EDU-00072",
  "EDU-00073",
  "EDU-00074",
  "EDU-00075",
  "EDU-00076",
  "EDU-00078",
  "EDU-00079",
  "EDU-00080",
  "EDU-00081",
  "EDU-00082",
  "EDU-00083",
  "EDU-00084",
  "EDU-00085",
  "EDU-00086",
  "EDU-00087",
  "EDU-00088",
  "EDU-00089",
  "EDU-00090",
  "EDU-00091",
  "EDU-00092",
  "EDU-00093",
  "EDU-00094",
  "EDU-00095",
  "EDU-00096",
  "EDU-00097",
  "EDU-00098",
  "EDU-00099",
  "EDU-00100",
  "EDU-00101",
  "EDU-00102",
  "EDU-00103",
  "EDU-00104",
  "EDU-00105",
  "EDU-00106",
  "EDU-00107",
  "EDU-00108",
  "EDU-00109",
  "EDU-00110",
  "EDU-00111",
  "EDU-00112",
];

/**
 * Represents students Disability status both from application submitted
 * and the student profile disability status verification.
 */
export interface DisabilityDetails {
  /**
   * Calculated PD/PPD status applied in the application by the student.
   */
  calculatedPDPPDStatus: boolean;
  /**
   * Student profile disability status.
   */
  studentProfileDisabilityStatus: DisabilityStatus;
}

/**
 * Represents an active student restriction.
 */
export interface StudentActiveRestriction {
  /**
   * Restriction id.
   */
  id: number;
  /**
   * Association between the student and
   * the active restriction on his account.
   */
  studentRestrictionId: number;
  /**
   * Restriction code.
   */
  code: RestrictionCode;
  /**
   * Actions associated with the restriction.
   */
  actions: RestrictionActionType[];
}

/**
 * Active restriction bypass active for the application.
 */
export interface ApplicationActiveRestrictionBypass {
  /**
   * Bypass ID.
   */
  id: number;
  /**
   * Restriction code being bypassed.
   */
  restrictionCode: string;
  /**
   * Student restriction bypassed.
   */
  studentRestrictionId: number;
  /**
   * Bypass behavior.
   */
  bypassBehavior: RestrictionBypassBehaviors;
}

/**
 * Offering details needed for an e-Cert calculations.
 */
export type EligibleECertOffering = Pick<
  EducationProgramOffering,
  | "id"
  | "offeringIntensity"
  | "actualTuitionCosts"
  | "programRelatedCosts"
  | "mandatoryFees"
>;

/**
 * Disbursement eligible to be part of an e-Cert.
 * The disbursement is the focus of calculations and data changes
 * while the other properties are supporting information.
 */
export class EligibleECertDisbursement {
  private readonly studentRestrictionsBypassedIds: number[];
  /**
   * Creates a new instance of a eligible e-Cert to be calculated.
   * @param studentId student id.
   * @param hasValidSIN indicates if the student has a validated SIN.
   * @param assessmentId assessment id.
   * @param applicationId application id.
   * @param applicationNumber application number. Intended to be used
   * primarily for logging purposes.
   * @param disbursement Eligible schedule that must have the values updated
   * calculated for an e-Cert. This database entity model will receive all
   * modifications across multiple calculations steps. If all calculations
   * are successful this will be used to persist the data to the database.
   * @param offering education program offering.
   * @param maxLifetimeBCLoanAmount maximum BC loan configured to the assessment's
   * program year.
   * @param disabilityDetails students Disability status both from application submitted
   * and the student profile disability status verification.
   * @param restrictions all active student restrictions actions. These actions can
   * impact the e-Cert calculations.
   * This is a shared array reference between all the disbursements of a single student.
   * Changes to this array should be available for all disbursements of the student.
   * If a particular step generates or resolves an active restriction this array should
   * be updated using the method {@link refreshActiveStudentRestrictions} to allow all
   * steps to have access to the most updated data.
   * @param restrictionBypass all active restrictions bypasses applied the student application.
   */
  constructor(
    public readonly studentId: number,
    public readonly hasValidSIN: boolean,
    public readonly assessmentId: number,
    public readonly applicationId: number,
    public readonly applicationNumber: string,
    public readonly disbursement: DisbursementSchedule,
    public readonly offering: EligibleECertOffering,
    public readonly maxLifetimeBCLoanAmount: number,
    public readonly disabilityDetails: DisabilityDetails,
    readonly restrictions: StudentActiveRestriction[],
    readonly restrictionBypass: ApplicationActiveRestrictionBypass[],
  ) {
    this.studentRestrictionsBypassedIds = this.restrictionBypass.map(
      (bypass) => bypass.studentRestrictionId,
    );
  }

  /**
   * Refresh the complete list of student restrictions.
   * @param activeRestrictions represents the most updated
   * snapshot of all student active restrictions.
   */
  refreshActiveStudentRestrictions(
    activeRestrictions: StudentActiveRestriction[],
  ) {
    this.restrictions.length = 0;
    this.restrictions.push(...activeRestrictions);
  }

  /**
   * All student active restrictions.
   */
  get activeRestrictions(): ReadonlyArray<StudentActiveRestriction> {
    return this.restrictions;
  }

  /**
   * All application active restrictions bypasses.
   */
  get activeRestrictionBypasses(): ReadonlyArray<ApplicationActiveRestrictionBypass> {
    return this.restrictionBypass;
  }

  /**
   * List of restrictions not bypassed that will be applied to the application.
   */
  getEffectiveRestrictions(): ReadonlyArray<StudentActiveRestriction> {
    return this.restrictions.filter(
      (restriction) =>
        !this.studentRestrictionsBypassedIds.includes(
          restriction.studentRestrictionId,
        ),
    );
  }
}

/**
 * Map student restrictions to the representation of active
 * restrictions used along e-Cert calculations.
 * @param studentRestrictions student active restrictions to be mapped.
 * @returns simplified student active restrictions.
 */
export function mapStudentActiveRestrictions(
  studentRestrictions: StudentRestriction[],
): StudentActiveRestriction[] {
  return studentRestrictions.map<StudentActiveRestriction>(
    (studentRestriction) => ({
      studentRestrictionId: studentRestriction.id,
      id: studentRestriction.restriction.id,
      code: studentRestriction.restriction.restrictionCode as RestrictionCode,
      actions: studentRestriction.restriction.actionType,
    }),
  );
}

/**
 * Possible failed results from an e-Cert validation.
 * An disbursement could be either ready to be disbursed and just waiting
 * for the proper date to be sent or it can have multiple issues that would
 * prevent it from being disbursed.
 */
export enum ECertFailedValidation {
  /**
   * Waiting for confirmation of enrolment to be completed.
   */
  NonCompletedCOE = "NonCompletedCOE",
  /**
   * Student SIN is invalid or the validation is pending.
   */
  InvalidSIN = "InvalidSIN",
  /**
   * Student MSFAA associated with the disbursement is cancelled.
   */
  MSFAACanceled = "MSFAACanceled",
  /**
   * Student MSFAA associated with the disbursement is not signed.
   */
  MSFAANotSigned = "MSFAANotSigned",
  /**
   * Student disability Status PD/PPD is not verified.
   */
  DisabilityStatusNotConfirmed = "DisabilityStatusNotConfirmed",
  /**
   * Student has an active 'StopFullTimeDisbursement' or 'StopPartTimeDisbursement'
   * restriction and the disbursement calculation will not proceed.
   */
  HasStopDisbursementRestriction = "HasStopDisbursementRestriction",
  /**
   * Lifetime maximum CSLP is reached.
   * Affects only part-time disbursements.
   */
  LifetimeMaximumCSLP = "LifetimeMaximumCSLP",
  /**
   * Awards values are not present or the sum of all
   * the estimated awards is $0.
   */
  NoEstimatedAwardAmounts = "NoEstimatedAwardAmounts",
}
