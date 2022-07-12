import { Vue } from "vue-class-component";

export interface FormValidationResult {
  valid: boolean;
}

export interface ErrorMessage {
  errorMessages: string[];
}

export type VForm = Vue & {
  /**
   * Validates all registered inputs. Returns true if successful and false if not.
   */
  validate: () => Promise<FormValidationResult>;
  /**
   * Resets the state of all registered inputs (inside the form) to {} for arrays and null for all other values.
   * Resets errors bag when using the lazy-validation prop.
   */
  reset: () => void;
  /**
   * Resets validation of all registered inputs without modifying their state
   */
  resetValidation: () => void;
  errors: ErrorMessage[];
};
