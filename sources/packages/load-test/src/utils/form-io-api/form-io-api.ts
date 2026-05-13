import http, { RefinedResponse, ResponseType } from "k6/http";
import { FORMS_URL, FORMIO_API_KEY } from "../../../config.env";

/**
 * Form.io authentication header.
 */
const FORM_IO_TOKEN_HEADER = "x-token";

/**
 * Get the form.io authentication header.
 * @returns form.io authentication header.
 */
export function createFormAuthHeader(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    [FORM_IO_TOKEN_HEADER]: FORMIO_API_KEY,
  };
}

/**
 * Executes a form.io form submission using dryRun.
 * @param formPath form path.
 * @param payload form data.
 * @param headers authentication header.
 * @returns post submission response.
 */
export function formSubmission(
  formPath: string,
  payload: unknown,
  headers: Record<string, string>,
): RefinedResponse<ResponseType> {
  return http.post(
    `${FORMS_URL}/${formPath}/submission?dryRun=1`,
    JSON.stringify(payload),
    { headers },
  );
}

/**
 * Get a form.io definition by its alias.
 * @param alias form alias.
 * @param headers authentication header.
 * @returns get response.
 */
export function getFormByAlias(
  alias: string,
  headers: Record<string, string>,
): RefinedResponse<ResponseType> {
  return http.get(`${FORMS_URL}/${alias}`, { headers });
}
