import { DisbursementSchedule, OfferingIntensity } from "@sims/sims-db";
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
  ValidateDisbursementFullTimeStep,
} from "../e-cert-processing-steps";
import { ECertGenerationService } from "../e-cert-generation.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class FullTimeCalculationProcess extends ECertCalculationProcess {
  constructor(
    dataSource: DataSource,
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly validateDisbursementFullTimeStep: ValidateDisbursementFullTimeStep,
    private readonly applyOverawardsDeductionsStep: ApplyOverawardsDeductionsStep,
    private readonly calculateEffectiveValueStep: CalculateEffectiveValueStep,
    private readonly applyStopBCFundingRestrictionFullTimeStep: ApplyStopBCFundingRestrictionFullTimeStep,
    private readonly assertLifeTimeMaximumFullTimeStep: AssertLifeTimeMaximumFullTimeStep,
    private readonly calculateTuitionRemittanceEffectiveAmountStep: CalculateTuitionRemittanceEffectiveAmountStep,
    private readonly createBCTotalGrantsStep: CreateBCTotalGrantsStep,
    private readonly persistCalculationsStep: PersistCalculationsStep,
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
      this.validateDisbursementFullTimeStep,
      this.applyOverawardsDeductionsStep,
      this.calculateEffectiveValueStep,
      this.applyStopBCFundingRestrictionFullTimeStep,
      this.assertLifeTimeMaximumFullTimeStep,
      this.calculateTuitionRemittanceEffectiveAmountStep,
      this.createBCTotalGrantsStep,
      this.persistCalculationsStep,
    ];
  }
}
