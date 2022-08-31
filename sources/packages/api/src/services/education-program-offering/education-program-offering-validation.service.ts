import { Injectable } from "@nestjs/common";
import { OfferingStatus } from "../../database/entities";
import {
  OfferingValidationResult,
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
        enableImplicitConversion: false,
      });
      const validationErrors = validateSync(offeringModel);
      return {
        offeringModel,
        validationErrors,
      };
    });
  }

  getOfferingSavingWarnings(errors: ValidationError[]): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    errors.forEach((error) => {
      const flattenedContexts = flattenContexts(error);
      const contextWarnings = flattenedContexts
        .map((context) => Object.values(context))
        .flat(1)
        .filter(
          (contextProperty: ValidationWarning) => contextProperty.isWarning,
        );
      warnings.push(...contextWarnings);
    });
    return warnings;
  }

  getOfferingSavingStatus(
    errors: ValidationError[],
  ): OfferingStatus.Approved | OfferingStatus.CreationPending | undefined {
    const totalErrors = flattenErrorMessages(errors).length;
    const totalWarnings = this.getOfferingSavingWarnings(errors).length;
    if (totalErrors === 0) {
      return OfferingStatus.Approved;
    }
    if (totalErrors === totalWarnings) {
      return OfferingStatus.CreationPending;
    }
    return undefined;
  }
}
