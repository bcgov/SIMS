import { OfferingIntensity } from "@sims/sims-db";
import { ECertProcessStep } from "../e-cert-processing-steps/e-cert-steps-models";
import { ECertCalculationProcess } from "./e-cert-calculation-process";
import { DataSource } from "typeorm";
import {
  CalculateEffectiveValueStep,
  CalculateTuitionRemittanceEffectiveAmountStep,
  CreateBCTotalGrantsStep,
  PersistCalculationsStep,
  ValidateDisbursementPartTimeStep,
  ApplyStopBCFundingRestrictionPartTimeStep,
  RestrictionBypassesResolutionStep,
} from "../e-cert-processing-steps";
import { ECertGenerationService } from "../e-cert-generation.service";
import { Injectable } from "@nestjs/common";
import { EligibleECertDisbursement } from "../disbursement-schedule.models";
import { ECertNotificationService } from "../e-cert-notification/e-cert-notification.service";

/**
 * Executes the part-time calculations for the e-Cert generation.
 */
@Injectable()
export class PartTimeCalculationProcess extends ECertCalculationProcess {
  constructor(
    dataSource: DataSource,
    eCertNotificationService: ECertNotificationService,
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly validateDisbursementPartTimeStep: ValidateDisbursementPartTimeStep,
    private readonly calculateEffectiveValueStep: CalculateEffectiveValueStep,
    private readonly calculateTuitionRemittanceEffectiveAmountStep: CalculateTuitionRemittanceEffectiveAmountStep,
    private readonly createBCTotalGrantsStep: CreateBCTotalGrantsStep,
    private readonly persistCalculationsStep: PersistCalculationsStep,
    private readonly restrictionBypassesResolutionStep: RestrictionBypassesResolutionStep,
    private readonly applyStopBCFundingRestrictionPartTimeStep: ApplyStopBCFundingRestrictionPartTimeStep,
  ) {
    super(dataSource, eCertNotificationService);
  }

  /**
   * Get all part-time disbursements currently eligible to be part of
   * an e-Cert to have its calculations executed.
   * The returned array of {@link EligibleECertDisbursement} will be shared across all
   * steps being modified till the disbursement entity model
   * modifications will be saved.
   * @returns eligible disbursements to be validated and calculated.
   */
  protected getDisbursements(): Promise<EligibleECertDisbursement[]> {
    return this.eCertGenerationService.getEligibleDisbursements({
      offeringIntensity: OfferingIntensity.partTime,
      checkDisbursementMinDate: true,
    });
  }

  /**
   * Define the steps to be executed and the execution order.
   * @returns list of calculation steps to be execute sequentially.
   */
  protected calculationSteps(): ECertProcessStep[] {
    return [
      this.validateDisbursementPartTimeStep,
      this.calculateEffectiveValueStep,
      this.calculateTuitionRemittanceEffectiveAmountStep,
      this.createBCTotalGrantsStep,
      this.persistCalculationsStep,
      this.restrictionBypassesResolutionStep,
      this.applyStopBCFundingRestrictionPartTimeStep,
    ];
  }
}
