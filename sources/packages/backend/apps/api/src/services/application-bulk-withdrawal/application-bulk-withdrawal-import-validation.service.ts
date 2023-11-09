import { Injectable } from "@nestjs/common";
import {
  ApplicationBulkWithdrawalValidationModel,
  ApplicationWithdrawalValidationResult,
} from "./application-bulk-withdrawal-validation.models";
import { validateSync } from "class-validator";
import { plainToClass } from "class-transformer";
import {
  ValidationResult,
  extractValidationsByType,
} from "../../utilities/class-validation";

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
  validateModels(
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
      const allWarnings: ValidationResult[] = [];
      validationsErrors.forEach((error) => {
        const validation = extractValidationsByType(error);
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
