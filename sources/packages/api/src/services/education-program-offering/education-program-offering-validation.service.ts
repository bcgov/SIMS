import { Injectable } from "@nestjs/common";
import { OfferingStatus } from "../../database/entities";
import {
  OfferingValidationResult,
  OfferingValidationWarnings,
  SaveOfferingModel,
  ValidationWarning,
} from "./education-program-offering-validation.models";
import { validateSync, ValidationError } from "class-validator";
import { plainToClass } from "class-transformer";
import {
  flattenContexts,
  flattenErrorMessages,
} from "../../utilities/class-validation";
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
    return offerings.map((offering) => {
      // Ensures that the object received is a class. This is needed to the
      // proper validation metadata be available to the validation be performed.
      const offeringModel = plainToClass(SaveOfferingModel, offering, {
        enableImplicitConversion: true,
      });
      const errors = validateSync(offeringModel);
      const flattenedErrors = flattenErrorMessages(errors);
      const warnings = this.getOfferingSavingWarnings(errors);
      const offeringStatus = this.getOfferingSavingStatus(
        flattenedErrors.length,
        warnings.length,
      );

      if (!silently && !offeringStatus) {
        throw new CustomNamedError(
          "The validated offering has critical errors.",
          OFFERING_VALIDATION_CRITICAL_ERROR,
        );
      }

      return {
        offeringModel,
        offeringStatus,
        warnings,
        errors: flattenedErrors,
      };
    });
  }

  private getOfferingSavingWarnings(
    errors: ValidationError[],
  ): OfferingValidationWarnings[] {
    const warnings: OfferingValidationWarnings[] = [];
    errors.forEach((error) => {
      const flattenedContexts = flattenContexts(error);
      const contextWarnings = flattenedContexts
        .flatMap((context) => Object.values(context))
        .filter(
          (contextProperty: ValidationWarning) => contextProperty.isWarning,
        )
        .map((warning: ValidationWarning) => warning.warningType);
      warnings.push(...contextWarnings);
    });
    return warnings;
  }

  private getOfferingSavingStatus(
    totalErrors: number,
    totalWarnings: number,
  ): OfferingStatus.Approved | OfferingStatus.CreationPending | undefined {
    if (totalErrors === 0) {
      return OfferingStatus.Approved;
    }
    if (totalErrors === totalWarnings) {
      // If all errors are warnings then the offering can be created
      // but it will need a review and approval by the Ministry.
      return OfferingStatus.CreationPending;
    }
    return undefined;
  }
}
