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
 * Error response returned by GC notify
 * if an error occurs on adding a notification
 * to it.
 */
export interface GCNotifyErrorResponse {
  errors: GCNotifyErrorDetail[];
  status_code: HttpStatus;
}

/**
 * Email message format.
 */
export interface NotificationEmailMessage {
  template_id: string;
  email_address: string;
  personalisation?: {
    [key: string]:
      | string
      | string[]
      | number
      | {
          file: string;
          filename: string;
          sending_method: "attach" | "link";
        };
  };
}
