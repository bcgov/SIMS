import { Injectable } from "@nestjs/common";
import { OfferingStatus } from "../../database/entities";
import {
  OfferingValidationResult,
  SaveOfferingModel,
  ValidationWarning,
  ValidationWarningResult,
} from "./education-program-offering-validation.models";
import { validateSync, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";
import { flattenErrors } from "../../utilities/class-validation";
import { CustomNamedError } from "../../utilities";
import { OFFERING_VALIDATION_CRITICAL_ERROR } from "../../constants";

@Injectable()
export class EducationProgramOfferingValidationService {
  validateOfferingModel(
    offering: SaveOfferingModel,
    silently = false,
  ): OfferingValidationResult {
    const [validation] = this.validateOfferingModels([offering], silently);
    return validation;
  }

  validateOfferingModels(
    offerings: SaveOfferingModel[],
    silently = false,
  ): OfferingValidationResult[] {
    return offerings.map((offering, index) => {
      // Ensures that the object received is a class. This is needed to the
      // proper validation metadata be available to the validation be performed.
      const offeringModel = plainToClass(SaveOfferingModel, offering, {
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

  private getOfferingSavingStatus(
    totalErrors: number,
    totalWarnings: number,
  ): OfferingStatus.Approved | OfferingStatus.CreationPending | undefined {
    if (totalErrors === 0) {
      return OfferingStatus.Approved;
    }
    if (totalWarnings > 0) {
      return OfferingStatus.CreationPending;
    }
    return undefined;
  }
}
