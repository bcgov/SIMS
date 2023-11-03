import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { StudentScholasticStandingsService } from "../../services";
import {
  ApplicationBulkWithdrawalValidationResultAPIOutDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
} from "./models/student-scholastic-standings.dto";
import { transformToActiveApplicationDataAPIOutDTO } from "../institution-locations/models/application.dto";
import { ApplicationWithdrawalValidationResult } from "../../services/application-bulk-withdrawal/application-bulk-withdrawal-validation.models";
import { ApiProcessError } from "../../types";
import { APPLICATION_WITHDRAWAL_VALIDATION_ERROR } from "../../constants";

/**
 * Scholastic standing controller service.
 */
@Injectable()
export class ScholasticStandingControllerService {
  constructor(
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
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
          applicationNumber:
            validation.applicationBulkWithdrawalValidationModel
              .applicationNumber,
          withdrawalDate:
            validation.applicationBulkWithdrawalValidationModel.withdrawalDate,
          sin: validation.applicationBulkWithdrawalValidationModel.sin,
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
