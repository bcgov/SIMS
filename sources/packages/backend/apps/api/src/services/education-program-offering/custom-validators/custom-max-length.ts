import { MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE } from "../../../utilities";
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "customMaxLength", async: false })
export class CustomMaxLength implements ValidatorConstraintInterface {
  validate(value: number) {
    return value <= MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be not greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE}!`;
  }
}
