import { defineRule } from "vee-validate";
import { required } from "@vee-validate/rules";
import { sinValidationRule } from "./SinNumberValidator";

export default function configValidationRules() {
  // A list of available rules to be used could be found on
  // https://vee-validate.logaretm.com/v4/guide/global-validators#available-rules
  defineRule("required", required);
  defineRule("sin-number", sinValidationRule);
}
