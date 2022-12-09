import { HttpStatus } from "@nestjs/common";

export interface GCNotifyResult {
  content: ContentPayload;
  id: string;
  reference: string;
  scheduled_for: string; //API payload require this naming convention, so we are not following camelCase.
  template: Template;
  uri: string;
}

export interface Template {
  id: string;
  uri: string;
  version: number;
}

export interface ContentPayload {
  body: string;
  from_email: string; //API payload require this naming convention, so we are not following camelCase.
  subject: number;
}

export interface RequestPayload<T> {
  email_address: string; //API payload require this naming convention, so we are not following camelCase.
  template_id: string; //API payload require this naming convention, so we are not following camelCase.
  personalisation: T;
}

export interface GCNotifyErrorDetail {
  error: string;
  message: string;
}

/**
 * Error response returned by GCNotify
 * when notification request fails.
 */
// export class GCNotifyError extends Error {
//   constructor(
//     message: string,
//     errors: GCNotifyErrorDetail[],
//     status_code: HttpStatus,
//   ) {
//     super(message);
//     this.errors = errors;
//     this.status_code = status_code;
//   }
//   readonly errors: GCNotifyErrorDetail[];
//   readonly status_code: HttpStatus;
// }

export interface GCNotifyErrorResponse {
  errors: GCNotifyErrorDetail[];
  status_code: HttpStatus;
}
