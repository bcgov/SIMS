export interface GCNotifyResult {
  content: ContentPayload;
  id: string;
  reference: string;
  scheduled_for: string; //API payload require this naming convention, so we are not following camelcase.
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
  from_email: string; //API payload require this naming convention, so we are not following camelcase.
  subject: number;
}

export interface RequestPayload<T> {
  email_address: string; //API payload require this naming convention, so we are not following camelcase.
  template_id: string; //API payload require this naming convention, so we are not following camelcase.
  personalisation: T;
}

export interface StudentFileUploadPersonalisation {
  givenNames: string;
  lastName: string;
  dob: string;
  applicationNumber?: string;
  documentPurpose: string;
  date: string;
}
