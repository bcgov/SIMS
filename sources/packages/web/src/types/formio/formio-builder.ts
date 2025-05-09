/**
 * Form.io methods available can be checked on
 * https://help.form.io/developers/form-development/form-builder#form-builder-sdk.
 */
export interface FormIOBuilder {
  schema: unknown;
  form: unknown;
  options: FormIOBuilderOptions;
  on: (event: "change", callback: unknown) => unknown;
}

/**
 * Options object type.
 */
export interface FormIOBuilderOptions {
  readOnly: boolean;
}
