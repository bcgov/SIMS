export interface StartAssessmentQueueInDTO {
  workflowName?: string;
  assessmentId: number;
}

export interface CancelAssessmentQueueInDTO {
  assessmentId: number;
}
