import http, { RefinedResponse, ResponseType } from "k6/http";
import { BASE_LOAD_TEST_GATEWAY_URL } from "../../../config.env";

export function workflowPrepareAssessmentData(iterations: number): number[] {
  const response = http.post(
    `${BASE_LOAD_TEST_GATEWAY_URL}/workflow/prepare-assessment-data/${iterations}`,
    undefined,
    { timeout: "120s" }
  );
  const data = response.json() as number[];
  return data;
}
/**
 *
 * @param endpoint
 * @param credentials
 * @returns
 */
export function workflowAssessmentSubmission(
  assessmentId: number
): RefinedResponse<ResponseType> {
  return http.patch(
    `${BASE_LOAD_TEST_GATEWAY_URL}/workflow/submit-assessment/${assessmentId}`
  );
}
