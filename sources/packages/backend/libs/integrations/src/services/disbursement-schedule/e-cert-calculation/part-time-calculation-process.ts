import { DisbursementSchedule, OfferingIntensity } from "@sims/sims-db";
import { ECertProcessStep } from "../e-cert-processing-steps/e-cert-steps-models";
import { ECertCalculationProcess } from "./e-cert-calculation-process";
import { DataSource } from "typeorm";
import {
  ApplyOverawardsDeductionsStep,
  CalculateEffectiveValueStep,
  CalculateTuitionRemittanceEffectiveAmountStep,
  CreateBCTotalGrantsStep,
  PersistCalculationsStep,
  ValidateDisbursementPartTimeStep,
} from "../e-cert-processing-steps";
import { ECertGenerationService } from "../e-cert-generation.service";
import { Injectable } from "@nestjs/common";

/**
 * Executes the part-time calculations for the e-Cert generation.
 */
@Injectable()
export class PartTimeCalculationProcess extends ECertCalculationProcess {
  constructor(
    dataSource: DataSource,
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly validateDisbursementPartTimeStep: ValidateDisbursementPartTimeStep,
    private readonly applyOverawardsDeductionsStep: ApplyOverawardsDeductionsStep,
    private readonly calculateEffectiveValueStep: CalculateEffectiveValueStep,
    private readonly calculateTuitionRemittanceEffectiveAmountStep: CalculateTuitionRemittanceEffectiveAmountStep,
    private readonly createBCTotalGrantsStep: CreateBCTotalGrantsStep,
    private readonly persistCalculationsStep: PersistCalculationsStep,
  ) {
    super(dataSource);
  }

  /**
   * Get all part-time disbursements currently eligible to be part of
   * an e-Cert to have its calculations executed.
   * The returned array of {@link DisbursementSchedule} will be shared across all
   * steps being modified till the {@link DisbursementSchedule} entity model
   * modifications will be saved.
   */
  protected getDisbursements(): Promise<DisbursementSchedule[]> {
    return this.eCertGenerationService.getEligibleRecords(
      OfferingIntensity.partTime,
    );
  }

  /**
   * Define the steps to be executed and the execution order.
   */
  protected calculationSteps(): ECertProcessStep[] {
    return [
      this.validateDisbursementPartTimeStep,
      this.applyOverawardsDeductionsStep,
      this.calculateEffectiveValueStep,
      this.calculateTuitionRemittanceEffectiveAmountStep,
      this.createBCTotalGrantsStep,
      this.persistCalculationsStep,
    ];
  }
}
