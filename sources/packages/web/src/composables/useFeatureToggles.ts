export function useFeatureToggles() {
  const isFormSubmissionEnabled = !import.meta.env.PROD;
  /**
   * Indicates whether the new combined appeals queue is enabled.
   */
  const isNewAppealsQueueEnabled = !import.meta.env.PROD;
  return {
    isFormSubmissionEnabled,
    isNewAppealsQueueEnabled,
  };
}
