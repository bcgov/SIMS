import { Request } from "express";

/**
 * Header name for the client IP address.
 */
const CLIENT_IP_HEADER_NAME = "x-forwarded-for";

/**
 * Gets the client IP address from the http request.
 * @param request http request.
 * @returns client IP address..
 */
export function getClientIPFromRequest(request: Request): string {
  return (
    (request.headers[CLIENT_IP_HEADER_NAME] as string) ??
    request.socket.remoteAddress
  );
}
