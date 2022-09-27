import { Injectable } from "@nestjs/common";
import { OfferingStatus } from "../../database/entities";
import {
  OfferingValidationResult,
  OfferingValidationModel,
  ValidationWarning,
  ValidationWarningResult,
} from "./education-program-offering-validation.models";
import { validateSync, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";
import { flattenErrors } from "../../utilities/class-validation";
import { CustomNamedError } from "../../utilities";
import { OFFERING_VALIDATION_CRITICAL_ERROR } from "../../constants";

/**
 * Executes the validations on an offering model.
 */
@Injectable()
export class EducationProgramOfferingValidationService {
  /**
   * Validate a offering model and provide the result.
   * @param offering offering model to be validated.
   * @param silently if true, no exception is generated case the validation fails
   * and the success or failure can be determined from the result object.
   * @returns validation result or an exception in the case of a failed validation
   * combined with the silently parameter defined as false.
   */
  validateOfferingModel(
    offering: OfferingValidationModel,
    silently = false,
  ): OfferingValidationResult {
    const [validation] = this.validateOfferingModels([offering], silently);
    return validation;
  }

  /**
   * Validate offering models and provide the result for every model.
   * @param offerings offering models to be validated.
   * @param silently if true, no exception is generated case the validation fails
   * and the success or failure can be determined from the result object.
   * @returns validation result or an exception in the case of a failed validation
   * combined with the silently parameter defined as false.
   */
  validateOfferingModels(
    offerings: OfferingValidationModel[],
    silently = false,
  ): OfferingValidationResult[] {
    return offerings.map((offering, index) => {
      // Ensures that the object received is a class. This is needed to the
      // proper validation metadata be available to the validation be performed.
      const offeringModel = plainToClass(OfferingValidationModel, offering, {
        enableImplicitConversion: true,
      });
      const validationsErrors = validateSync(offeringModel);
      const allErrors: string[] = [];
      const allWarnings: ValidationWarningResult[] = [];
      validationsErrors.forEach((error) => {
        const [errors, warnings] = this.extractErrorsAndWarnings(error);
        allErrors.push(...errors);
        allWarnings.push(...warnings);
      });

      const offeringStatus = this.getOfferingSavingStatus(
        allErrors.length,
        allWarnings.length,
      );

      if (!silently && !!allErrors.length) {
        throw new CustomNamedError(
          "The validated offerings have critical errors.",
          OFFERING_VALIDATION_CRITICAL_ERROR,
          allErrors,
        );
      }

      return {
        index,
        offeringModel,
        offeringStatus,
        warnings: allWarnings,
        errors: allErrors,
      };
    });
  }

  /**
   * Inspect the validation error and its children checking when an error
   * happen as has a warning context (must be considered a warning) or it is
   * a critical error (has no warning context).
   * @param error error to be inspected.
   * @returns errors and warnings.
   */
  private extractErrorsAndWarnings(
    error: ValidationError,
  ): [errors: string[], warnings: ValidationWarningResult[]] {
    const errors: string[] = [];
    const warnings: ValidationWarningResult[] = [];
    const flattenedErrors = flattenErrors(error);
    flattenedErrors.forEach((error) => {
      Object.keys(error.constraints).forEach((errorConstraintKey) => {
        let associatedContext: ValidationWarning = undefined;
        if (error.contexts) {
          associatedContext = error.contexts[
            errorConstraintKey
          ] as ValidationWarning;
        }
        const errorDescription = error.constraints[errorConstraintKey];
        if (associatedContext?.isWarning) {
          warnings.push({
            warningType: associatedContext.warningType,
            warningMessage: errorDescription,
          });
        } else {
          errors.push(errorDescription);
        }
      });
    });
    return [errors, warnings];
  }

  /**
   * Defines the offering status based on the number of errors and warnings.
   * @param totalErrors total critical errors.
   * @param totalWarnings total warnings (offering can be saved but need Ministry review).
   * @returns offering approved, pending or undefined case there is some critical error.
   */
  private getOfferingSavingStatus(
    totalErrors: number,
    totalWarnings: number,
  ): OfferingStatus.Approved | OfferingStatus.CreationPending | undefined {
    if (totalErrors > 0) {
      return undefined;
    }
    if (totalWarnings > 0) {
      return OfferingStatus.CreationPending;
    }
    return OfferingStatus.Approved;
  }
}
