export interface SaveStudentApplicationDto {
  programYearId: number;
  data: any;
  associatedFiles: string[];
}

export interface CreateApplicationDraftResult {
  draftAlreadyExists: boolean;
  draftId?: number;
}
