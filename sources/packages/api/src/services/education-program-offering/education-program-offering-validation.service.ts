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

@Injectable()
export class EducationProgramOfferingValidationService {
  validateOfferingModels(
    offerings: SaveOfferingModel[],
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
      return {
        offeringModel,
        offeringStatus,
        warnings,
        errors,
        flattenedErrors,
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
      return OfferingStatus.CreationPending;
    }
    return undefined;
  }
}
