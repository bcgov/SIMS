/***
 * Error types from GRPC calls executed by the Zeebe client.
 * @see https://github.com/camunda-community-hub/zeebe-client-node-js/blob/22a1bc1c593963a8877b3cbf8c12264d4a0a5056/src/lib/GrpcClient.ts
 */
export enum ZeebeGRPCErrorTypes {
  OK = 0,
  CANCELLED = 1,
  UNKNOWN = 2,
  INVALID_ARGUMENT = 3,
  DEADLINE_EXCEEDED = 4,
  NOT_FOUND = 5,
  ALREADY_EXISTS = 6,
  PERMISSION_DENIED = 7,
  UNAUTHENTICATED = 16,
  RESOURCE_EXHAUSTED = 8,
  FAILED_PRECONDITION = 9,
  ABORTED = 10,
  OUT_OF_RANGE = 11,
  UNIMPLEMENTED = 12,
  INTERNAL = 13,
  UNAVAILABLE = 14,
  DATA_LOSS = 15,
}

/**
 * Zeebe GRPC exception.
 */
export class ZeebeGRPCError extends Error {
  constructor(
    message: string,
    public readonly code: ZeebeGRPCErrorTypes,
    public readonly details: string,
  ) {
    super(message);
  }

  /**
   * Checks if the unknown error is a GRPC error based in the existence
   * of the code and details properties. Case both properties are present
   * the error will be considered a GRPC error and an the exception will
   * be thrown.
   * @param error error to be checked.
   * @param message optional message to be added. The GRPC error already contains
   * the details message, that's why this message would be an optional message
   * to provide further context.
   * @throws ZeebeGRPCError
   */
  static throwIfZeebeGRPCError(error: unknown, message?: string) {
    const zeebeGRPCError = error as ZeebeGRPCError;
    if (zeebeGRPCError.code && zeebeGRPCError.details) {
      throw new ZeebeGRPCError(
        message,
        zeebeGRPCError.code,
        zeebeGRPCError.details,
      );
    }
  }
}
