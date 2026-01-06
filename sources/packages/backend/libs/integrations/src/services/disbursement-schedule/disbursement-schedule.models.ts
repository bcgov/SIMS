import { RestrictedParty, RestrictionCode } from "@sims/services";
import {
  ActionEffectiveCondition,
  DisabilityStatus,
  DisbursementSchedule,
  DisbursementValueType,
  EducationProgram,
  EducationProgramOffering,
  FormYesNoOptions,
  InstitutionLocation,
  InstitutionRestriction,
  ModifiedIndependentStatus,
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
 * Represents student's "estranged from parents" answer from the submitted application.
 * and the student profile modified independent status, which allows to determine
 * if the e-Cert must be blocked due to modified independent.
 */
export interface ModifiedIndependentDetails {
  /**
   * Indicates how the student answered the estranged from parents question.
   */
  estrangedFromParents?: FormYesNoOptions;
  /**
   * Modified independent status associated to the student.
   */
  studentProfileModifiedIndependent: ModifiedIndependentStatus;
}

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
 * Represents an active restriction which can be student or institution restriction.
 */
export type ActiveRestriction =
  | StudentActiveRestriction
  | InstitutionActiveRestriction;

/**
 * Base class for active restrictions.
 */
abstract class BaseActiveRestriction {
  /**
   * Restriction id.
   */
  id: number;
  /**
   * Restriction code.
   */
  code: RestrictionCode;
  /**
   * Actions associated with the restriction.
   */
  actions: RestrictionActionType[];
  /**
   * Action effective conditions associated with the restriction.
   */
  actionEffectiveConditions?: ActionEffectiveCondition[];
}

/**
 * Represents an active student restriction.
 */
export class StudentActiveRestriction extends BaseActiveRestriction {
  readonly restrictedParty: RestrictedParty.Student;
  constructor() {
    super();
    this.restrictedParty = RestrictedParty.Student;
  }
  /**
   * Association between the student and
   * the active restriction on his account.
   */
  studentRestrictionId: number;
}

/**
 * Represents an active institution restriction.
 */
export class InstitutionActiveRestriction extends BaseActiveRestriction {
  readonly restrictedParty: RestrictedParty.Institution;
  constructor() {
    super();
    this.restrictedParty = RestrictedParty.Institution;
  }
  /**
   * Association between the institution and
   * the active restriction on institution account.
   */
  institutionRestrictionId: number;
  /**
   * Specific program the restriction applies to.
   */
  program: EducationProgram;
  /**
   * Specific location the restriction applies to.
   */
  location: InstitutionLocation;
}

/**
 * Restriction bypass active for the application.
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
  | "aviationCredentialType"
  | "educationProgram"
  | "institutionLocation"
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
   * @param institutionId institution id.
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
   * @param modifiedIndependentDetails student's "estranged from parents" information.
   * @param restrictions all active student restrictions actions. These actions can
   * impact the e-Cert calculations.
   * This is a shared array reference between all the disbursements of a single student.
   * Changes to this array should be available for all disbursements of the student.
   * If a particular step generates or resolves an active restriction this array should
   * be updated using the method {@link refreshActiveStudentRestrictions} to allow all
   * steps to have access to the most updated data.
   * @param restrictionBypass all active restrictions bypasses applied to the student application.
   * @param institutionRestrictions all active institution restrictions for the application institution.
   */
  constructor(
    readonly studentId: number,
    readonly hasValidSIN: boolean,
    readonly institutionId: number,
    readonly assessmentId: number,
    readonly applicationId: number,
    readonly applicationNumber: string,
    readonly disbursement: DisbursementSchedule,
    readonly offering: EligibleECertOffering,
    readonly maxLifetimeBCLoanAmount: number,
    readonly disabilityDetails: DisabilityDetails,
    readonly modifiedIndependentDetails: ModifiedIndependentDetails,
    private readonly restrictions: StudentActiveRestriction[],
    private readonly restrictionBypass: ApplicationActiveRestrictionBypass[],
    private readonly institutionRestrictions: InstitutionActiveRestriction[],
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
  ): void {
    this.restrictions.length = 0;
    this.restrictions.push(...activeRestrictions);
  }

  /**
   * Refresh the complete list of institution restrictions.
   * @param activeInstitutionRestrictions represents the most updated
   * snapshot of all institution active restrictions.
   */
  refreshActiveInstitutionRestrictions(
    activeInstitutionRestrictions: InstitutionActiveRestriction[],
  ): void {
    this.institutionRestrictions.length = 0;
    this.institutionRestrictions.push(...activeInstitutionRestrictions);
  }

  /**
   * All student active restrictions.
   */
  get activeRestrictions(): ReadonlyArray<StudentActiveRestriction> {
    return this.restrictions;
  }

  /**
   * All institution active restrictions.
   */
  get activeInstitutionRestrictions(): ReadonlyArray<InstitutionActiveRestriction> {
    return this.institutionRestrictions;
  }

  /**
   * All application active restrictions bypasses.
   */
  get activeRestrictionBypasses(): ReadonlyArray<ApplicationActiveRestrictionBypass> {
    return this.restrictionBypass;
  }

  /**
   * List of student restrictions not bypassed that will be applied to the application.
   */
  private getEffectiveStudentRestrictions(): ReadonlyArray<StudentActiveRestriction> {
    // The restrictions list can be updated as the e-Cert is calculated.
    // That is why the effective list should be calculated using the most
    // recent values.
    return this.restrictions.filter(
      (restriction) =>
        !this.studentRestrictionsBypassedIds.includes(
          restriction.studentRestrictionId,
        ),
    );
  }

  /**
   * List the effective institution restrictions for the given disbursement.
   * @returns Effective institution restrictions.
   */
  private getEffectiveInstitutionRestrictions(): ReadonlyArray<InstitutionActiveRestriction> {
    const programId = this.offering.educationProgram.id;
    const locationId = this.offering.institutionLocation.id;
    return this.institutionRestrictions.filter(
      (restriction) =>
        restriction.program.id === programId &&
        restriction.location.id === locationId,
    );
  }

  /**
   * Get all effective restrictions from student and application institution.
   * @returns effective restrictions.
   */
  getEffectiveRestrictions(): ReadonlyArray<ActiveRestriction> {
    const allEffectiveRestrictions = [
      ...this.getEffectiveStudentRestrictions(),
      ...this.getEffectiveInstitutionRestrictions(),
    ];
    return allEffectiveRestrictions;
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
    (studentRestriction) => {
      const activeRestriction = new StudentActiveRestriction();
      activeRestriction.studentRestrictionId = studentRestriction.id;
      activeRestriction.id = studentRestriction.restriction.id;
      activeRestriction.code = studentRestriction.restriction
        .restrictionCode as RestrictionCode;
      activeRestriction.actions = studentRestriction.restriction.actionType;
      activeRestriction.actionEffectiveConditions =
        studentRestriction.restriction.actionEffectiveConditions;
      return activeRestriction;
    },
  );
}

/**
 * Map institution restrictions to the representation of active
 * restrictions used along e-Cert calculations.
 * @param institutionRestrictions institution active restrictions to be mapped.
 * @returns simplified institution active restrictions.
 */
export function mapInstitutionActiveRestrictions(
  institutionRestrictions: InstitutionRestriction[],
): InstitutionActiveRestriction[] {
  return institutionRestrictions.map<InstitutionActiveRestriction>(
    (institutionRestriction) => {
      const activeRestriction = new InstitutionActiveRestriction();
      activeRestriction.institutionRestrictionId = institutionRestriction.id;
      activeRestriction.id = institutionRestriction.restriction.id;
      activeRestriction.code = institutionRestriction.restriction
        .restrictionCode as RestrictionCode;
      activeRestriction.actions = institutionRestriction.restriction.actionType;
      activeRestriction.program = institutionRestriction.program;
      activeRestriction.location = institutionRestriction.location;
      activeRestriction.actionEffectiveConditions =
        institutionRestriction.restriction.actionEffectiveConditions;
      return activeRestriction;
    },
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
   * Student modified independent status is not approved.
   */
  ModifiedIndependentStatusNotApproved = "ModifiedIndependentStatusNotApproved",
  /**
   * Student has an active 'StopFullTimeDisbursement' or 'StopPartTimeDisbursement'
   * restriction and the disbursement calculation will not proceed.
   */
  HasStopDisbursementRestriction = "HasStopDisbursementRestriction",
  /**
   * Institution has an effective 'StopFullTimeDisbursement' or 'StopPartTimeDisbursement'
   * restriction for the application location and program and the disbursement calculation will not proceed.
   */
  HasStopDisbursementInstitutionRestriction = "HasStopDisbursementInstitutionRestriction",
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

interface StopDisbursementRestrictionValidationResult {
  resultType:
    | ECertFailedValidation.HasStopDisbursementRestriction
    | ECertFailedValidation.HasStopDisbursementInstitutionRestriction;
  additionalInfo: { restrictionCodes: RestrictionCode[] };
}

interface OtherECertFailedValidationResult {
  resultType: Exclude<
    ECertFailedValidation,
    | ECertFailedValidation.HasStopDisbursementRestriction
    | ECertFailedValidation.HasStopDisbursementInstitutionRestriction
  >;
}

export type ECertFailedValidationResult =
  | StopDisbursementRestrictionValidationResult
  | OtherECertFailedValidationResult;

/**
 * Map of disbursement value IDs to disbursement schedule IDs.
 */
export interface DisbursementValueMap {
  [disbursementValueId: number]: number;
}
