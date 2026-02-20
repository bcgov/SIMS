export function useFeatureToggles() {
  const isFormSubmissionEnabled = !import.meta.env.PROD;
  return {
    isFormSubmissionEnabled,
  };
}
