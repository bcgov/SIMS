/**
 * The below objects definitions where based on the document on
 * https://sminfo.gov.bc.ca/ based on the documentation available on
 * "BCeID Client - New Web Services - Developers Guide - V2.10.0 (for BCeID WS V10).docx"
 */

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
 * This enumerated type indicates the type of failure when a request fails.
 * All responses return one of the codes below in the event that the
 * responseCode is set to Failed.
 */
export enum FailureCodes {
  /**
   * No failure.  Used during the successful response.
   */
  Void = "Void",
  /**
   * No results retrieved from the request.
   */
  NoResults = "NoResults",
  /**
   * No results retrieved from the request but the results
   * were expected from the request.
   */
  ExpectedResults = "ExpectedResults",
  /**
   * One or more of the arguments of the request did not
   * meet the requirements of the request.
   * Information given in the response.message property.
   */
  ArgumentException = "ArgumentException",
  /**
   * The user was not authenticated or not authorized for the request.
   * More information given in the response.message property.
   */
  AuthenticationException = "AuthenticationException",
  /**
   * The request did meet the primitive argument requirements but failed to validate against the business rules.  For further information see the message property.
   */
  ValidationException = "ValidationException",
  /**
   * The IDIR Service Account was not allowed to access a particular Web Method.
   */
  AuthorizationException = "AuthorizationException",
}

/**
 * Common SOAP call response properties.
 */
export class ResponseBase {
  /**
   * The coarse grain result of the request.
   */
  code: ResponseCodes;
  /**
   * The coarse grain failure result of the request.
   */
  failureCode: FailureCodes;
  /**
   * The English language description of the result of the request.
   * Used for development and debugging purposes.
   */
  message: string;
  /**
   * Checks if the response represents a request that was executed with
   * success but did not return any results.
   * @returns true it is an empty response.
   */
  public static hasNoResults(response: ResponseBase): boolean {
    return (
      response.code === ResponseCodes.Failed &&
      response.failureCode === FailureCodes.NoResults
    );
  }
}

export enum BCeIDAccountTypeCodes {
  /**
   * The Internal BC Government directory (IDIR).
   */
  Internal = "Internal",
  /**
   * Business BCeID account type.
   */
  Business = "Business",
}

/**
 * While executing a search on BCeID, these are the sort options.
 */
export enum SortBCeIDAccountOnProperty {
  /**
   * No sort field specified. Specifying this value will result in an error message.
   */
  Void = "Void",
  /**
   * Sort on User ID.
   */
  UserId = "UserId",
  /**
   * Sort on first name.
   */
  Firstname = "Firstname",
  /**
   * Sort on last name.
   */
  LastName = "LastName",
  /**
   * Sort on middle name.
   */
  MiddleName1 = "MiddleName1",
  /**
   * Sort on other middle name.
   */
  MiddleName2 = "MiddleName2",
  /**
   * Sort on email address
   */
  Email = "Email",
  /**
   * Sort on telephone.
   */
  Telephone = "Telephone",
}

/**
 * While executing a search on BCeID, these are the sort direction options.
 */
export enum SortDirection {
  /**
   * No direction specified. Specifying this value will result in an error message.
   */
  Void = "Void",
  /**
   * Sort in ascending order.
   */
  Ascending = "Ascending",
  /**
   * Sort in descending order.
   */
  Descending = "Descending",
}

/**
 * Raw value from BCeID Soap response.
 */
export interface SoapResponseRawValue {
  readonly value: string;
}

export interface IndividualIdentitySoapResponse {
  readonly name: IndividualIdentityNameSoapResponse;
}

export interface IndividualIdentityNameSoapResponse {
  readonly firstname: SoapResponseRawValue;
  readonly surname: SoapResponseRawValue;
}

export interface IndividualIdentityContactSoapResponse {
  readonly email: SoapResponseRawValue;
  readonly telephone: SoapResponseRawValue;
}

/**
 * BCeID account soap response from searchBCeIDAccount
 * method from BCeID Web Service.
 */
export interface BCeIDAccountSoapResponse {
  readonly guid: SoapResponseRawValue;
  readonly userId: SoapResponseRawValue;
  readonly individualIdentity?: IndividualIdentitySoapResponse;
  readonly contact?: IndividualIdentityContactSoapResponse;
}
