/**
 * Field requirement types used in metadata to define the field requirement.
 */
export enum FieldRequirementType {
  /**
   * The field is required and must be provided.
   */
  Required = "required",
  /**
   * The field is optional and may be provided or omitted.
   */
  Optional = "optional",
  /**
   * The field is not allowed and must not be provided.
   */
  NotAllowed = "not allowed",
}
