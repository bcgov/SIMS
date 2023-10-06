import { check, sleep } from "k6";
import { APPLICATION_SUBMISSION_PAYLOAD } from "./models";
import {
  createFormAuthHeader,
  formSubmission,
} from "../../../utils/form-io-api";

interface SetupData {
  formIOHeader: Record<string, string>;
}

export const options = {
  vus: 100,
  duration: "120s",
};

export function setup(): SetupData {
  const formIOHeader = createFormAuthHeader();
  return { formIOHeader };
}

export default function (setupData: SetupData) {
  const submitResponse = formSubmission(
    "sfaa2023-24",
    APPLICATION_SUBMISSION_PAYLOAD,
    setupData.formIOHeader
  );
  check(submitResponse, {
    "Created with success": (r) => r.status === 201,
  });
  sleep(1);
}
