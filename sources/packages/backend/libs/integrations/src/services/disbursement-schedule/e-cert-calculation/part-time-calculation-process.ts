import { DisbursementSchedule, OfferingIntensity } from "@sims/sims-db";
import { ApplyOverawardsDeductionsStep } from "../e-cert-processing-steps/apply-overawards-deductions-step";
import { CalculateTuitionRemittanceEffectiveAmountStep } from "../e-cert-processing-steps/calculate-tuition-remittance-effective-amount";
import { CreateBCTotalGrantsStep } from "../e-cert-processing-steps/create-bc-total-grants-step";
import { ECertGenerationService } from "../e-cert-processing-steps/e-cert-generation-service";
import { ECertProcessStep } from "../e-cert-processing-steps/e-cert-steps-models";
import { ECertCalculationProcess } from "./e-cert-calculation-process";
import { CalculateEffectiveValuePartTimeStep } from "../calculate-effective-value-parttime-step";
import { DataSource } from "typeorm";

export class PartTimeCalculationProcess extends ECertCalculationProcess {
  constructor(
    dataSource: DataSource,
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly applyOverawardsDeductionsStep: ApplyOverawardsDeductionsStep,
    private readonly calculateEffectiveValuePartTimeStep: CalculateEffectiveValuePartTimeStep,
    private readonly calculateTuitionRemittanceEffectiveAmountStep: CalculateTuitionRemittanceEffectiveAmountStep,
    private readonly createBCTotalGrantsStep: CreateBCTotalGrantsStep,
  ) {
    super(dataSource);
  }

  protected getDisbursements(
    studentId: number,
  ): Promise<DisbursementSchedule[]> {
    return this.eCertGenerationService.getEligibleRecords(
      OfferingIntensity.fullTime,
    );
  }

  protected calculationSteps(): ECertProcessStep[] {
    return [
      this.applyOverawardsDeductionsStep,
      this.calculateEffectiveValuePartTimeStep,
      this.calculateTuitionRemittanceEffectiveAmountStep,
      this.createBCTotalGrantsStep,
    ];
  }
}
