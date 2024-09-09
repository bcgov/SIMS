import { Vue } from "vue-class-component";

/**
 * Vuetify result from a call to the 'validate()' method.
 */
export interface FormValidationResult {
  valid: boolean;
}

/**
 * Vuetify error message.
 */
export interface ErrorMessage {
  errorMessages: string[];
}

/**
 * Vuetify v-form type definition.
 */
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
  /**
   * Form errors.
   */
  errors: ErrorMessage[];
};

/**
 * Vuetify file for a v-file-input component.
 */
export interface InputFile extends Blob {
  lastModified: number;
  lastModifiedDate: Date;
  name: string;
  size: number;
  type: string;
}

export interface SelectItemType {
  title: string;
  value: string | number;
}

export type Event = { target: { value: string } };
