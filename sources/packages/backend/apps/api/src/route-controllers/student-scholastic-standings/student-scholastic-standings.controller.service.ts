import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApplicationWithdrawalTextValidationResult,
  StudentRestrictionService,
  StudentScholasticStandingsService,
  StudentService,
} from "../../services";
import {
  ApplicationBulkWithdrawalValidationResultAPIOutDTO,
  ScholasticStandingData,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
  ScholasticStandingSummaryDetailsAPIOutDTO,
} from "./models/student-scholastic-standings.dto";
import { transformToActiveApplicationDataAPIOutDTO } from "../institution-locations/models/application.dto";
import { ApplicationWithdrawalValidationResult } from "../../services/application-bulk-withdrawal/application-bulk-withdrawal-validation.models";
import { ApiProcessError } from "../../types";
import {
  APPLICATION_WITHDRAWAL_TEXT_CONTENT_FORMAT_ERROR,
  APPLICATION_WITHDRAWAL_VALIDATION_ERROR,
} from "../../constants";
import { RestrictionCode } from "@sims/services";

/**
 * Scholastic standing controller service.
 */
@Injectable()
export class ScholasticStandingControllerService {
  constructor(
    private readonly studentService: StudentService,
    private readonly studentRestrictionService: StudentRestrictionService,
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
  ) {}

  /**
   * Get Scholastic Standing submitted details.
   * @param scholasticStandingId scholastic standing id.
   * @param options options for the scholastic standing details.
   * - `studentId` student id to retrieve the scholastic standing details.
   * - `locationIds` location ids to retrieve the scholastic standing details.
   * @returns Scholastic Standing.
   */
  async getScholasticStanding(
    scholasticStandingId: number,
    options?: {
      studentId?: number;
      locationIds?: number[];
    },
  ): Promise<ScholasticStandingSubmittedDetailsAPIOutDTO> {
    const scholasticStanding =
      await this.studentScholasticStandingsService.getScholasticStanding(
        scholasticStandingId,
        options,
      );

    if (!scholasticStanding) {
      throw new NotFoundException("Scholastic Standing not found.");
    }

    const application = scholasticStanding.application;
    const offering = scholasticStanding.referenceOffering;
    const scholasticStandingData: ScholasticStandingData =
      scholasticStanding.submittedData;
    return {
      ...scholasticStandingData,
      ...transformToActiveApplicationDataAPIOutDTO(application, offering),
      currentAssessmentTriggerType: application.currentAssessment.triggerType,
      reversalDate: scholasticStanding.reversalDate,
      nonPunitiveFormSubmissionItemId:
        scholasticStanding.nonPunitiveFormSubmissionItem?.id,
    };
  }

  /**
   * Get Scholastic Standing summary details.
   * @param studentId student id to retrieve the scholastic standing summary.
   * @returns Scholastic Standing summary details.
   */
  async getScholasticStandingSummary(
    studentId: number,
  ): Promise<ScholasticStandingSummaryDetailsAPIOutDTO> {
    const studentExists = await this.studentService.studentExists(studentId);
    if (!studentExists) {
      throw new NotFoundException("Student does not exist.");
    }
    const [
      {
        fullTimeUnsuccessfulCompletionWeeks,
        partTimeUnsuccessfulCompletionWeeks,
      },
      fullTimeWithdrawalsCount,
    ] = await Promise.all([
      this.studentScholasticStandingsService.getScholasticStandingSummary(
        studentId,
      ),
      this.studentRestrictionService.countRestrictionByCode(
        studentId,
        RestrictionCode.WTHD,
      ),
    ]);

    return {
      fullTimeLifetimeUnsuccessfulCompletionWeeks:
        fullTimeUnsuccessfulCompletionWeeks,
      partTimeLifetimeUnsuccessfulCompletionWeeks:
        partTimeUnsuccessfulCompletionWeeks,
      fullTimeWithdrawalsCount,
    };
  }

  /**
   * Verify if all text file validations were performed with success and throw
   * a BadRequestException in case of some failure.
   * @param textValidations validations to be verified.
   */
  assertTextValidationsAreValid(
    textValidations: ApplicationWithdrawalTextValidationResult[],
  ): void {
    const textValidationsErrors = textValidations.filter(
      (textValidation) => textValidation.errors.length,
    );
    if (textValidationsErrors.length) {
      // At least one error was detected and the text must be fixed.
      const validationResults: ApplicationBulkWithdrawalValidationResultAPIOutDTO[] =
        textValidationsErrors.map((validation) => ({
          recordIndex: validation.index,
          applicationNumber: validation.textModel.applicationNumber,
          withdrawalDate: validation.textModel.withdrawalDate,
          errors: validation.errors,
          infos: [],
          warnings: [],
        }));
      throw new BadRequestException(
        new ApiProcessError(
          "One or more text data fields received are not in the correct format.",
          APPLICATION_WITHDRAWAL_TEXT_CONTENT_FORMAT_ERROR,
          validationResults,
        ),
      );
    }
  }

  /**
   * Verify if all application withdrawal validations were performed with success and throw
   * a BadRequestException in case of some failure.
   * @param validationsResult validation results to be verified.
   */
  assertValidationsAreValid(
    validationsResult: ApplicationWithdrawalValidationResult[],
  ): void {
    const validations = validationsResult.filter(
      (validationResult) =>
        validationResult.errors.length || validationResult.warnings.length,
    );
    if (validations.length) {
      // At least one error or warning was detected.
      const errorValidationResults: ApplicationBulkWithdrawalValidationResultAPIOutDTO[] =
        validations.map((validation) => ({
          recordIndex: validation.index,
          applicationNumber: validation.validationModel.applicationNumber,
          withdrawalDate: validation.validationModel.withdrawalDate,
          errors: validation.errors,
          warnings: validation.warnings,
          infos: [],
        }));
      throw new BadRequestException(
        new ApiProcessError(
          "One or more fields have validation errors.",
          APPLICATION_WITHDRAWAL_VALIDATION_ERROR,
          errorValidationResults,
        ),
      );
    }
  }
}
