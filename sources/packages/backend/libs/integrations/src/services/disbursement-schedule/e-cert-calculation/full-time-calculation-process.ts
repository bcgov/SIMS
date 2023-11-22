import { DisbursementSchedule, OfferingIntensity } from "@sims/sims-db";

import { ECertGenerationService } from "../e-cert-processing-steps/e-cert-generation-service";
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
} from "../e-cert-processing-steps";

export class FullTimeCalculationProcess extends ECertCalculationProcess {
  constructor(
    dataSource: DataSource,
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly applyOverawardsDeductionsStep: ApplyOverawardsDeductionsStep,
    private readonly calculateEffectiveValueStep: CalculateEffectiveValueStep,
    private readonly applyStopBCFundingRestrictionFullTimeStep: ApplyStopBCFundingRestrictionFullTimeStep,
    private readonly assertLifeTimeMaximumFullTimeStep: AssertLifeTimeMaximumFullTimeStep,
    private readonly calculateTuitionRemittanceEffectiveAmountStep: CalculateTuitionRemittanceEffectiveAmountStep,
    private readonly createBCTotalGrantsStep: CreateBCTotalGrantsStep,
  ) {
    super(dataSource);
  }

  protected getDisbursements(): Promise<DisbursementSchedule[]> {
    return this.eCertGenerationService.getEligibleRecords(
      OfferingIntensity.fullTime,
    );
  }

  protected calculationSteps(): ECertProcessStep[] {
    return [
      this.applyOverawardsDeductionsStep,
      this.calculateEffectiveValueStep,
      this.applyStopBCFundingRestrictionFullTimeStep,
      this.assertLifeTimeMaximumFullTimeStep,
      this.calculateTuitionRemittanceEffectiveAmountStep,
      this.createBCTotalGrantsStep,
    ];
  }
}
