import { EligibleECertDisbursement } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";
import { ECertGenerationService } from "./e-cert-generation.service";
import { StudentLoanBalanceSharedService } from "@sims/services";
import {
  Application,
  COEStatus,
  DisabilityStatus,
  DisbursementSchedule,
  OfferingIntensity,
  RestrictionActionType,
} from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class DisbursementEligibilityValidation {
  constructor(
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly studentLoanBalanceSharedService: StudentLoanBalanceSharedService,
    public readonly disbursement: DisbursementSchedule,
    public readonly application?: Application,
    public readonly eCertDisbursement?: EligibleECertDisbursement,
  ) {}

  /**
   * Verify the COE status as completed for the disbursement.
   * @returns boolean indicating true if the COE status is completed, false otherwise.
   */
  get isCompletedCoeStatus(): boolean {
    return this.disbursement.coeStatus === COEStatus.completed;
  }

  /**
   * Verify the student has a valid SIN.
   * @return boolean indicating true if the student has a valid SIN, false otherwise.
   */
  get hasValidSIN(): boolean {
    if (this.application) {
      return !!this.application.student.sinValidation.isValidSIN;
    } else {
      return this.eCertDisbursement.hasValidSIN;
    }
  }

  /**
   * Verify that the MSFAA is signed for the student.
   * @returns boolean indicating true if the MSFAA is signed, false otherwise.
   */
  get hasMSFAASignature(): boolean {
    return !!this.disbursement.msfaaNumber?.dateSigned;
  }

  /**
   * Verify that the MSFAA has a cancelled date.
   * @returns boolean indicating true if the MSFAA has a cancelled date, false otherwise.
   */
  get hasMSFAACancelledDate(): boolean {
    return !!this.disbursement.msfaaNumber?.cancelledDate;
  }

  /**
   * Verify that the MSFAA status is valid.
   */
  get hasValidMSFAAStatus(): boolean {
    return this.hasMSFAASignature && !this.hasMSFAACancelledDate;
  }

  /**
   * Verify the disability status for the student.
   * @returns boolean indicating true if the disability status is verified, false otherwise.
   */
  get hasValidDisabilityStatus(): boolean {
    const calculatedPDPPDStatus =
      this.application?.currentAssessment.workflowData.calculatedData
        .pdppdStatus ||
      this.eCertDisbursement?.disabilityDetails.calculatedPDPPDStatus;
    const disabilityStatus =
      this.application?.student.disabilityStatus ||
      this.eCertDisbursement.disabilityDetails.studentProfileDisabilityStatus;
    return calculatedPDPPDStatus
      ? [DisabilityStatus.PD, DisabilityStatus.PPD].includes(disabilityStatus)
      : true;
  }

  /**
   * Verify that the student has restrictions for part time applications.
   * @returns boolean indicating true if the student has restriction, false otherwise.
   */
  get hasRestriction(): boolean {
    let hasRestriction = false;
    const studentRestrictions = this.application.student.studentRestrictions;
    if (studentRestrictions.length > 0) {
      const actionType =
        this.application.currentAssessment.offering.offeringIntensity ===
        OfferingIntensity.fullTime
          ? RestrictionActionType.StopFullTimeDisbursement
          : RestrictionActionType.StopPartTimeDisbursement;
      // Filter restriction action type for part time applications.
      const filterStudentRestrictions = studentRestrictions.filter(
        (studentRestriction) =>
          studentRestriction.restriction.actionType.includes(actionType),
      );
      hasRestriction = filterStudentRestrictions.length > 0;
    }
    return hasRestriction;
  }

  /**
   * Validate if CSLP disbursed exceeded the lifetime maximums.
   * @param assessmentId student assessment Id.
   * @param entityManager EntityManager used to execute the commands in the same transaction.
   * @returns boolean indicating true if CSLP does not exceed the lifetime maximums, false otherwise.
   */
  async validateCSLPDisbursement(
    awardCode: string,
    entityManager?: EntityManager,
  ): Promise<boolean> {
    // Get the disbursed value for the CSLP in the current disbursement.
    const disbursementCSLP = this.disbursement.disbursementValues.find(
      (item) => item.valueCode === awardCode,
    );
    // If disbursement value for CSLP doesn't have a value amount,
    // then CSLP does not exceed the lifetime maximums.
    if (!disbursementCSLP?.valueAmount) {
      return true;
    }
    // Fetch lifetime maximum of CSLP from the workflow data.
    const assessmentId =
      this.application?.currentAssessment.id ||
      this.eCertDisbursement?.assessmentId;
    const lifetimeMaximumsCSLPPromise =
      this.eCertGenerationService.getCSLPLifetimeMaximums(
        assessmentId,
        entityManager,
      );
    // Get latest CSLP monthly balance.
    const studentId =
      this.application?.student.id || this.eCertDisbursement?.studentId;
    const latestCSLPBalancePromise =
      this.studentLoanBalanceSharedService.getLatestCSLPBalance(studentId);
    const [lifetimeMaximumsCSLP, latestCSLPBalance] = await Promise.all([
      lifetimeMaximumsCSLPPromise,
      latestCSLPBalancePromise,
    ]);
    return (
      lifetimeMaximumsCSLP >= disbursementCSLP.valueAmount + latestCSLPBalance
    );
  }
}
