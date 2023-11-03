import { BadRequestException, Injectable } from "@nestjs/common";
import {
  ApplicationBulkWithdrawalImportBusinessValidationModel,
  ApplicationWithdrawalValidationResult,
  ApplicationWithdrawalValidationWarnings,
} from "./application-bulk-withdrawal-import-business-validation.models";
import { validateSync } from "class-validator";
import { plainToClass } from "class-transformer";
import {
  ValidationResult,
  extractValidationsByType,
} from "../../utilities/class-validation";
import { CustomNamedError } from "@sims/utilities";
import {
  APPLICATION_BULK_WITHDRAWAL_VALIDATION_CRITICAL_ERROR,
  APPLICATION_WITHDRAWAL_VALIDATION_ERROR,
} from "../../constants";
import { ApiProcessError } from "../../types";
import { ApplicationBulkWithdrawalValidationResultAPIOutDTO } from "../../route-controllers/student-scholastic-standings/models/student-scholastic-standings.dto";

/**
 * Executes the validations on an offering model.
 */
@Injectable()
export class ApplicationBulkWithdrawalImportValidationService {
  /**
   * Validate offering models and provide the result for every model.
   * @param businessValidationModels application bulk withdrawal business validation models to be validated.
   * @param silently if true, no exception is generated case the validation fails
   * and the success or failure can be determined from the result object.
   * @returns validation result or an exception in the case of a failed validation
   * combined with the silently parameter defined as false.
   */
  validateApplicationBulkWithdrawalModels(
    businessValidationModels: ApplicationBulkWithdrawalImportBusinessValidationModel[],
    silently = false,
  ): ApplicationWithdrawalValidationResult[] {
    return businessValidationModels.map((model, index) => {
      // Ensures that the object received is a class. This is needed to the
      // proper validation metadata be available to the validation be performed.
      const applicationBulkWithdrawalBusinessValidationModel = plainToClass(
        ApplicationBulkWithdrawalImportBusinessValidationModel,
        model,
        {
          enableImplicitConversion: true,
        },
      );
      const validationsErrors = validateSync(
        applicationBulkWithdrawalBusinessValidationModel,
      );
      const allErrors: string[] = [];
      const allWarnings: ValidationResult<ApplicationWithdrawalValidationWarnings>[] =
        [];
      validationsErrors.forEach((error) => {
        const validation = extractValidationsByType<
          ApplicationWithdrawalValidationWarnings,
          undefined
        >(error);
        allErrors.push(...validation.errors);
        allWarnings.push(...validation.warnings);
      });

      if (!silently && !!allErrors.length) {
        throw new CustomNamedError(
          "The application bulk withdrawal has critical errors.",
          APPLICATION_BULK_WITHDRAWAL_VALIDATION_CRITICAL_ERROR,
          allErrors,
        );
      }

      return {
        index,
        applicationBulkWithdrawalBusinessValidationModel,
        warnings: allWarnings,
        errors: allErrors,
      };
    });
  }

  /**
   * Verify if all application withdrawal business validations were performed with success and throw
   * a BadRequestException in case of some failure.
   * @param businessValidationsResult business validation results to be verified.
   */
  assertValidationsAreValid(
    businessValidationsResult: ApplicationWithdrawalValidationResult[],
  ) {
    const businessValidations = businessValidationsResult.filter(
      (businessValidationResult) =>
        businessValidationResult.errors.length ||
        businessValidationResult.warnings.length,
    );
    if (businessValidations.length) {
      // At least one error or warning was detected.
      const errorValidationResults: ApplicationBulkWithdrawalValidationResultAPIOutDTO[] =
        businessValidations.map((validation) => ({
          recordIndex: validation.index,
          applicationNumber:
            validation.applicationBulkWithdrawalBusinessValidationModel
              .applicationNumber,
          withdrawalDate:
            validation.applicationBulkWithdrawalBusinessValidationModel
              .withdrawalDate,
          sin: validation.applicationBulkWithdrawalBusinessValidationModel.sin,
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
