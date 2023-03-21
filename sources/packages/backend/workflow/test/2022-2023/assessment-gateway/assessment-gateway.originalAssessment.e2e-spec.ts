import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  ApplicationExceptionStatus,
  AssessmentTriggerType,
  ProgramInfoStatus,
} from "@sims/sims-db";
import { ZBClient } from "zeebe-node";
import {
  createFakeConsolidatedFulltimeData,
  ZeebeMockedClient,
  E2E_STUDENT_STATUS,
  E2E_APPLICATION_EXCEPTION_STATUS,
  E2E_PIR_STATUS,
  PROCESS_INSTANCE_CREATE_TIMEOUT,
} from "../../test-utils";
import { PROGRAM_YEAR } from "../constants/program-year.constants";

describe("E2E Test Workflow assessment gateway", () => {
  let zeebeClientProvider: ZBClient;
  beforeAll(async () => {
    zeebeClientProvider = ZeebeMockedClient.getMockedZeebeInstance();
  });

  it("Should generate expected fulltime assessment values for a single and independent student.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.assessmentTriggerType =
      AssessmentTriggerType.OriginalAssessment;

    await zeebeClientProvider.createProcessInstanceWithResult({
      bpmnProcessId: "assessment-gateway",
      variables: {
        ...assessmentConsolidatedData,
        [ASSESSMENT_ID]: 1,
        [E2E_STUDENT_STATUS]: "independentSingleStudent",
        [E2E_APPLICATION_EXCEPTION_STATUS]: ApplicationExceptionStatus.Approved,
        [E2E_PIR_STATUS]: ProgramInfoStatus.notRequired,
      },
      requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
    });
  });
});
