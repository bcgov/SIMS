import { Injectable } from "@nestjs/common";
import {
  ApplicationBulkWithdrawalValidationModel,
  ApplicationWithdrawalValidationResult,
  ApplicationWithdrawalValidationWarnings,
} from "./application-bulk-withdrawal-validation.models";
import { validateSync } from "class-validator";
import { plainToClass } from "class-transformer";
import {
  ValidationResult,
  extractValidationsByType,
} from "../../utilities/class-validation";
import { CustomNamedError } from "@sims/utilities";
import { APPLICATION_BULK_WITHDRAWAL_VALIDATION_CRITICAL_ERROR } from "../../constants";

/**
 * Executes the validations on an offering model.
 */
@Injectable()
export class ApplicationBulkWithdrawalImportValidationService {
  /**
   * Validate offering models and provide the result for every model.
   * @param validationModels application bulk withdrawal validation models to be validated.
   * @returns validation result or an exception in the case of a failed validation
   * combined with the silently parameter defined as false.
   */
  validateApplicationBulkWithdrawalModels(
    validationModels: ApplicationBulkWithdrawalValidationModel[],
  ): ApplicationWithdrawalValidationResult[] {
    return validationModels.map((model, index) => {
      // Ensures that the object received is a class. This is needed to the
      // proper validation metadata be available to the validation be performed.
      const validationModel = plainToClass(
        ApplicationBulkWithdrawalValidationModel,
        model,
        {
          enableImplicitConversion: true,
        },
      );
      const validationsErrors = validateSync(validationModel);
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

      return {
        index,
        validationModel,
        warnings: allWarnings,
        errors: allErrors,
      };
    });
  }
}
