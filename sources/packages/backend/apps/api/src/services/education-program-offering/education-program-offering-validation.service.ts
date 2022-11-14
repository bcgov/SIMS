import { Injectable } from "@nestjs/common";
import { OfferingStatus } from "@sims/sims-db";
import {
  OfferingValidationResult,
  OfferingValidationModel,
  ValidationResult,
  ValidationContext,
  ValidationContextTypes,
} from "./education-program-offering-validation.models";
import { validateSync, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";
import { flattenErrors } from "../../utilities/class-validation";
import { CustomNamedError } from "@sims/utilities";
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
      const allWarnings: ValidationResult[] = [];
      const allInfos: ValidationResult[] = [];
      validationsErrors.forEach((error) => {
        const validation = this.extractValidationsByType(error);
        allErrors.push(...validation.errors);
        allWarnings.push(...validation.warnings);
        allInfos.push(...validation.infos);
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
        infos: allInfos,
        warnings: allWarnings,
        errors: allErrors,
      };
    });
  }

  /**
   * Inspect the validation error and its children checking when an error
   * happen as has an additional context (must be considered a warning or a info)
   * or it is a critical error (has no warning or info context).
   * @param error error to be inspected.
   * @returns errors, warnings and infos.
   */
  private extractValidationsByType(error: ValidationError): {
    errors: string[];
    warnings: ValidationResult[];
    infos: ValidationResult[];
  } {
    const errors: string[] = [];
    const warnings: ValidationResult[] = [];
    const infos: ValidationResult[] = [];
    const flattenedErrors = flattenErrors(error);
    flattenedErrors.forEach((error) => {
      Object.keys(error.constraints).forEach((errorConstraintKey) => {
        let associatedContext: ValidationContext = undefined;
        if (error.contexts) {
          associatedContext = error.contexts[
            errorConstraintKey
          ] as ValidationContext;
        }
        const errorDescription = error.constraints[errorConstraintKey];
        if (associatedContext?.type === ValidationContextTypes.Warning) {
          warnings.push({
            typeCode: associatedContext.typeCode,
            message: errorDescription,
          });
        } else if (
          associatedContext?.type === ValidationContextTypes.Information
        ) {
          infos.push({
            typeCode: associatedContext.typeCode,
            message: errorDescription,
          });
        } else {
          errors.push(errorDescription);
        }
      });
    });
    return { errors, warnings, infos };
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
