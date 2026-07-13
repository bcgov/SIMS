import { Injectable } from "@nestjs/common";
import { ECertGenerationService } from "@sims/integrations/services";
import { EligibleECertDisbursement } from "@sims/integrations/services/disbursement-schedule/disbursement-schedule.models";
import {
  ACCEPT_ASSESSMENT_BLOCKING_VALIDATIONS,
  ApplicationECertPreValidatorResult,
  ECertPreValidator,
  ECertPreValidatorResult,
} from "@sims/integrations/services/disbursement-schedule/e-cert-calculation";
import {
  ValidateDisbursementFullTimeStep,
  ValidateDisbursementPartTimeStep,
} from "@sims/integrations/services/disbursement-schedule/e-cert-processing-steps";
import { OfferingIntensity } from "@sims/sims-db";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { DataSource } from "typeorm";

/**
 * Executes validations in eligible disbursements prior to its
 * disbursement time in an attempt to advise students that the
 * disbursement will be blocked if no action is taken.
 */
@Injectable()
export class ECertPreValidationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly validateDisbursementFullTimeStep: ValidateDisbursementFullTimeStep,
    private readonly validateDisbursementPartTimeStep: ValidateDisbursementPartTimeStep,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Executes the validations as close as possible to the e-Cert verifications prior to its disbursement
   * time in an attempt to advise students that the disbursement will be blocked if no action is taken.
   * The validations are executed in the next pending disbursement.
   * @param applicationId applications to have its disbursements validated. If no disbursement is pending
   * no validations will be executed.
   * @param allowNonCompleted: only select completed applications or allow any status.
   * @returns validation result for the next pending disbursement for the applications current's assessment.
   */
  async executePreValidations(
    applicationId: number,
    allowNonCompleted?: boolean,
  ): Promise<ECertPreValidatorResult> {
    const [firstEligibleDisbursement] =
      await this.eCertGenerationService.getEligibleDisbursements({
        applicationIds: [applicationId],
        allowNonCompleted: allowNonCompleted ?? false,
      });
    if (!firstEligibleDisbursement) {
      return new ECertPreValidatorResult([]);
    }
    const eCertPreValidator = this.getECertPreValidator(
      firstEligibleDisbursement,
    );
    const log = new ProcessSummary();
    const validations = await eCertPreValidator.executePreValidations(
      firstEligibleDisbursement,
      this.dataSource.manager,
      log,
    );
    this.logger.logProcessSummary(log);
    return validations;
  }

  /**
   * Execute the validations that would block a student from accepting an assessment.
   * @param applicationIds applications to have its first eligible disbursements validated.
   * @returns accept assessment validation result.
   */
  async executeAcceptAssessmentValidations(
    applicationIds: number[],
  ): Promise<ApplicationECertPreValidatorResult[]> {
    const eligibleDisbursements =
      await this.eCertGenerationService.getEligibleDisbursements({
        applicationIds,
        allowNonCompleted: true,
      });

    if (!eligibleDisbursements.length) {
      return [];
    }
    // Get only the first eligible disbursement for each application to validate the assessment acceptance.
    const applicationFirstEligibleDisbursements = eligibleDisbursements.filter(
      (disbursement) => disbursement.applicationEligibleDisbursementIndex === 1,
    );
    const log = new ProcessSummary();
    const applicationECertPreValidatorResults: ApplicationECertPreValidatorResult[] =
      [];
    for (const firstEligibleDisbursement of applicationFirstEligibleDisbursements) {
      const eCertPreValidator = this.getECertPreValidator(
        firstEligibleDisbursement,
      );
      const validationResult = await eCertPreValidator.executePreValidations(
        firstEligibleDisbursement,
        this.dataSource.manager,
        log,
        ACCEPT_ASSESSMENT_BLOCKING_VALIDATIONS,
      );
      applicationECertPreValidatorResults.push({
        applicationId: firstEligibleDisbursement.applicationId,
        validationResult,
      });
    }
    return applicationECertPreValidatorResults;
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
}
