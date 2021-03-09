/**
 * This enumerated type indicates the result of a request.
 * All responses return one of the codes below
 */
export enum ResponseCodes {
  /**
   * Successfully accomplished the derived request.
   */
  Success = "Success",
  /**
   * Failed to accomplish the derived request.
   */
  Failed = "Failed",
  /**
   * An error occurred in the BCeID application.
   * If you encounter this error please consider the BCeID
   * application unavailable and report this defect immediately
   */
  UnknownError = "UnknownError",
}

/**
 * Common SOAP call response properties.
 */
export interface ResponseBase {
  /**
   * The coarse grain result of the request.
   */
  code: ResponseCodes;
  /**
   * The coarse grain failure result of the request.
   */
  failureCode: string;
  /**
   * The English language description of the result of the request.
   * Used for development and debugging purposes.
   */
  message: string;
}
