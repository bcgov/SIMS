import { ObjectLiteral } from "typeorm";

/**
 * Field requirement types used in metadata to define the field requirement.
 */
export enum FieldRequirementType {
  /**
   * The field is required and must be provided.
   */
  Required = "required",
  /**
   * The field is not allowed and must not be provided.
   */
  NotAllowed = "not allowed",
}

/**
 * When a partial query must be created to be used in a parent query builder,
 * this interface defines the structure of the result.
 * It allows the parent query builder to consume the SQL fragment and the
 * parameters to be injected into the parent query.
 */
export interface QueryAndParamsForExecution {
  /**
   * The SQL fragment to be used in the parent query builder.
   */
  query: string;
  /**
   * The parameters to be injected into the parent query builder.
   */
  parameters: ObjectLiteral;
}
