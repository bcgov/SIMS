import { OfferingIntensity } from "@sims/sims-db";
import { ECertProcessStep } from "../e-cert-processing-steps/e-cert-steps-models";
import { ECertCalculationProcess } from "./e-cert-calculation-process";
import { DataSource } from "typeorm";
import {
  ApplyOverawardsDeductionsStep,
  ApplyStopBCFundingRestrictionFullTimeStep,
  AssertLifeTimeMaximumFullTimeStep,
  CalculateEffectiveValueStep,
  CalculateTuitionRemittanceEffectiveAmountStep,
  CreateBCTotalGrantsStep,
  PersistCalculationsStep,
  RestrictionBypassesResolutionStep,
  ValidateDisbursementFullTimeStep,
} from "../e-cert-processing-steps";
import { ECertGenerationService } from "../e-cert-generation.service";
import { Injectable } from "@nestjs/common";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { ECertNotificationService } from "../e-cert-notification/e-cert-notification.service";

/**
 * Executes the full-time calculations for the e-Cert generation.
 */
@Injectable()
export class FullTimeCalculationProcess extends ECertCalculationProcess {
  constructor(
    dataSource: DataSource,
    eCertNotificationService: ECertNotificationService,
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly validateDisbursementFullTimeStep: ValidateDisbursementFullTimeStep,
    private readonly applyOverawardsDeductionsStep: ApplyOverawardsDeductionsStep,
    private readonly calculateEffectiveValueStep: CalculateEffectiveValueStep,
    private readonly applyStopBCFundingRestrictionFullTimeStep: ApplyStopBCFundingRestrictionFullTimeStep,
    private readonly assertLifeTimeMaximumFullTimeStep: AssertLifeTimeMaximumFullTimeStep,
    private readonly calculateTuitionRemittanceEffectiveAmountStep: CalculateTuitionRemittanceEffectiveAmountStep,
    private readonly createBCTotalGrantsStep: CreateBCTotalGrantsStep,
    private readonly persistCalculationsStep: PersistCalculationsStep,
    private readonly restrictionBypassesResolutionStep: RestrictionBypassesResolutionStep,
  ) {
    super(dataSource, eCertNotificationService);
  }

  /**
   * Get all full-time disbursements currently eligible to be part of
   * an e-Cert to have its calculations executed.
   * The returned array of {@link DisbursementSchedule} will be shared across all
   * steps being modified till the {@link DisbursementSchedule} entity model
   * modifications will be saved.
   * @returns eligible disbursements to be validated and calculated.
   */
  protected getDisbursements(): Promise<EligibleECertDisbursement[]> {
    return this.eCertGenerationService.getEligibleDisbursements({
      offeringIntensity: OfferingIntensity.fullTime,
      checkDisbursementMinDate: true,
    });
  }

  /**
   * Define the steps to be executed and the execution order.
   * @returns list of calculation steps to be execute sequentially.
   */
  protected calculationSteps(): ECertProcessStep[] {
    return [
      this.validateDisbursementFullTimeStep,
      this.applyOverawardsDeductionsStep,
      this.calculateEffectiveValueStep,
      this.applyStopBCFundingRestrictionFullTimeStep,
      this.assertLifeTimeMaximumFullTimeStep,
      this.calculateTuitionRemittanceEffectiveAmountStep,
      this.createBCTotalGrantsStep,
      this.persistCalculationsStep,
      this.restrictionBypassesResolutionStep,
    ];
  }
}
