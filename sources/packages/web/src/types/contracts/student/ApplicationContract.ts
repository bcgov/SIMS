export interface SaveStudentApplicationDto {
  data: any;
  associatedFiles: string[];
}

export interface CreateApplicationDraftResult {
  draftAlreadyExists: boolean;
  draftId?: number;
}
