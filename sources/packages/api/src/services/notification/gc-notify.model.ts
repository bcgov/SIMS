export interface GcNotifyResult {
  content: ContentPayload;
  id: string;
  reference: string;
  scheduled_for: string;
  ended: true;
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
  from_email: string;
  subject: number;
}

export interface RequestPayload {
  email_address: string;
  template_id: string;
  personalisation: Personalisation;
}

export interface Personalisation {
  givenNames: string;
  lastName: string;
  dob?: Date;
  applicationNumber?: string;
  documentPurpose?: string;
  date?: Date;
}
