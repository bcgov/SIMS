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
import { ApiProcessError } from "../../types";
import { APPLICATION_WITHDRAWAL_TEXT_CONTENT_FORMAT_ERROR } from "../../constants";
import { ApplicationWithdrawalTextValidationResult } from "../../services/application-bulk-withdrawal/application-bulk-withdrawal-text.models";

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
          sin: validation.textModel.sin,
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
}
