import { Injectable } from "@nestjs/common";
import { ECertGenerationService } from "@sims/integrations/services";
import {
  ECertFailedValidation,
  EligibleECertDisbursement,
} from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";
import { ECertPreValidator } from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import {
  ValidateDisbursementFullTimeStep,
  ValidateDisbursementPartTimeStep,
} from "@sims/integrations/services/disbursement-schedule/e-cert-processing-steps";
import { OfferingIntensity } from "@sims/sims-db";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { DataSource } from "typeorm";

/**
 * Executes validations in eligible disbursements prior to its
 * disbursement time in an attempt to advise students that the
 * disbursement will be blocked if no action is taken.
 */
@Injectable()
export class ECertPreValidationService {
  constructor(
    private dataSource: DataSource,
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly validateDisbursementFullTimeStep: ValidateDisbursementFullTimeStep,
    private readonly validateDisbursementPartTimeStep: ValidateDisbursementPartTimeStep,
  ) {}

  /**
   * Executes the validations as close as possible to the e-Cert verifications prior to its disbursement
   * time in an attempt to advise students that the disbursement will be blocked if no action is taken.
   * The validations are executed in the next pending disbursement.
   * @param applicationId applications to have its disbursements validated. If no disbursement is pending
   * @param allowNonCompleted: only select completed applications or allow any status.
   * no validations will be executed.
   * @returns validation result for the next pending disbursement for the applications current's assessment.
   */
  async executePreValidations(
    applicationId: number,
    allowNonCompleted?: boolean,
  ): Promise<ECertFailedValidation[]> {
    const [firstEligibleDisbursement] =
      await this.eCertGenerationService.getEligibleDisbursements({
        applicationId,
        allowNonCompleted: allowNonCompleted ?? false,
      });
    if (!firstEligibleDisbursement) {
      return [];
    }
    const eCertPreValidator = this.getECertPreValidator(
      firstEligibleDisbursement,
    );
    const log = new ProcessSummary();
    const validations = eCertPreValidator.executePreValidations(
      firstEligibleDisbursement,
      this.dataSource.manager,
      log,
    );
    this.logger.logProcessSummary(log);
    return validations;
  }

  /**
   * Check for appropriate {@link ECertPreValidator} to
   * execute the disbursement validations.
   * @param eligibleECertDisbursement disbursement to be validated.
   * @returns validator to execute the assertions.
   */
  private getECertPreValidator(
    eligibleECertDisbursement: EligibleECertDisbursement,
  ): ECertPreValidator {
    return eligibleECertDisbursement.offering.offeringIntensity ===
      OfferingIntensity.fullTime
      ? this.validateDisbursementFullTimeStep
      : this.validateDisbursementPartTimeStep;
  }

  @InjectLogger()
  logger: LoggerService;
}
