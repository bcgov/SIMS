import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ApplicationWithdrawalTextValidationResult,
  StudentScholasticStandingsService,
} from "../../services";
import { SFASIndividualService } from "@sims/services";
import {
  ApplicationBulkWithdrawalValidationResultAPIOutDTO,
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

/**
 * Scholastic standing controller service.
 */
@Injectable()
export class ScholasticStandingControllerService {
  constructor(
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
    private readonly sfasIndividualService: SFASIndividualService,
  ) {}

  /**
   * Get Scholastic Standing submitted details.
   * @param scholasticStandingId scholastic standing id.
   * @param locationIds array of institution location ids.
   * @returns Scholastic Standing.
   */
  async getScholasticStanding(
    scholasticStandingId: number,
    locationIds?: number[],
  ): Promise<ScholasticStandingSubmittedDetailsAPIOutDTO> {
    const scholasticStanding =
      await this.studentScholasticStandingsService.getScholasticStanding(
        scholasticStandingId,
        locationIds,
      );

    if (!scholasticStanding) {
      throw new NotFoundException("Scholastic Standing not found.");
    }

    const application = scholasticStanding.application;
    const offering = scholasticStanding.referenceOffering;

    return {
      ...scholasticStanding.submittedData,
      ...transformToActiveApplicationDataAPIOutDTO(application, offering),
    };
  }

  /**
   * Get Scholastic Standing summary details.
   * @param studentId student id to retrieve the scholastic standing summary.
   * @returns Scholastic Standing summary details.
   */
  async getScholasticStandingSummary(options?: {
    studentId: number;
  }): Promise<ScholasticStandingSummaryDetailsAPIOutDTO> {
    const scholasticStandingSummary =
      await this.studentScholasticStandingsService.getScholasticStandingSummary(
        options?.studentId,
      );
    const SFASUnsuccessfulCompletionWeeks =
      await this.sfasIndividualService.getSFASTotalUnsuccessfulCompletionWeeks(
        options?.studentId,
      );
    return {
      lifetimeUnsuccessfulCompletionWeeks:
        +scholasticStandingSummary?.totalUnsuccessfulWeeks +
        +SFASUnsuccessfulCompletionWeeks,
    };
  }

  /**
   * Verify if all text file validations were performed with success and throw
   * a BadRequestException in case of some failure.
   * @param textValidations validations to be verified.
   */
  assertTextValidationsAreValid(
    textValidations: ApplicationWithdrawalTextValidationResult[],
  ) {
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
  ) {
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
