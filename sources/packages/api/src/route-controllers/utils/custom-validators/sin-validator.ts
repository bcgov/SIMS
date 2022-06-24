import {
  ValidatorConstraintInterface,
  ValidatorConstraint,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import { SIN_MAX_LENGTH } from "../../../database/entities";

/**
 * SIN validation algorithm (Luhn algorithm).
 * ! This logic is also present on form.io client side validations.
 */
@ValidatorConstraint()
export class IsValidSINConstraint implements ValidatorConstraintInterface {
  validate(sin: string): boolean {
    let valid = false;
    if (sin) {
      sin = sin.replace(/\s/g, "");
      if (sin.length === SIN_MAX_LENGTH) {
        let checksum = 0;
        for (let i = 0; i < sin.length; i++) {
          const currentDigit = +sin.charAt(i);
          if ((i + 1) % 2 === 0) {
            const digitTimes2 = currentDigit * 2;
            checksum += digitTimes2 < 10 ? digitTimes2 : digitTimes2 - 9;
          } else {
            checksum += +sin.charAt(i);
          }
        }
        if (checksum % 10 === 0) {
          valid = true;
        }
      }
    }
    return valid;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} is not a valid Social Insurance Number`;
  }
}

/**
 * SIN validation algorithm (Luhn algorithm).
 * ! This logic is also present on form.io client side validations.
 */
export function IsValidSIN(validationOptions?: ValidationOptions) {
  return (object: unknown, propertyName: string) => {
    registerDecorator({
      name: "IsValidSIN",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsValidSINConstraint,
    });
  };
}
