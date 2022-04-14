export interface CreateApplicationPayload {
  formUrl: string;
  formId: string;
  submissionId: string;
}

export enum checkboxFormioType {
  yes = "yes",
  no = "no",
}
