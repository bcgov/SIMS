export function useFeatureToggles() {
  const isFormSubmissionEnabled = !import.meta.env.PROD;
  /**
   * Indicates whether the new appeals and forms queue experience is enabled.
   * When enabled, the appeals list shows a combined view with a filter toggle
   * and a new forms queue list is available.
   */
  const isNewAppealsQueueEnabled = !import.meta.env.PROD;
  return {
    isFormSubmissionEnabled,
    isNewAppealsQueueEnabled,
  };
}
