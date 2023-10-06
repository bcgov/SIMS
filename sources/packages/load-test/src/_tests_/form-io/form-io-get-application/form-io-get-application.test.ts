import { check, sleep } from "k6";
import {
  createFormAuthHeader,
  getFormByAlias,
} from "../../../utils/form-io-api";

interface SetupData {
  formIOHeader: Record<string, string>;
}

export const options = {
  vus: 30,
  duration: "60s",
};

export function setup(): SetupData {
  const formIOHeader = createFormAuthHeader();
  return { formIOHeader };
}

export default function (setupData: SetupData) {
  const response = getFormByAlias("sfaa2023-24", setupData.formIOHeader);
  check(response, {
    "Created with success": (r) => r.status === 200,
  });
  if (response.status !== 200) {
    console.log(response.status_text);
  }
  sleep(1);
}
