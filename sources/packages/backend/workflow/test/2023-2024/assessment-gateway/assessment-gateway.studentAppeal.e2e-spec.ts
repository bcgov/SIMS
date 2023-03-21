import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import { AssessmentTriggerType } from "@sims/sims-db";
import { ZBClient } from "zeebe-node";
import {
  createFakeConsolidatedFulltimeData,
  ZeebeMockedClient,
  E2E_STUDENT_STATUS,
  PROCESS_INSTANCE_CREATE_TIMEOUT,
} from "../../test-utils";
import { PROGRAM_YEAR } from "../constants/program-year.constants";

describe(`E2E Test Workflow assessment gateway on student appeal for ${PROGRAM_YEAR}`, () => {
  let zeebeClientProvider: ZBClient;
  beforeAll(async () => {
    zeebeClientProvider = ZeebeMockedClient.getMockedZeebeInstance();
  });

  it("Should follow the expected workflow path when student single and independent.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.assessmentTriggerType =
      AssessmentTriggerType.StudentAppeal;

    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: "assessment-gateway",
        variables: {
          ...assessmentConsolidatedData,
          [ASSESSMENT_ID]: 1,
          [E2E_STUDENT_STATUS]: "independentSingleStudent",
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });
    expect(
      assessmentGatewayResponse.variables["associate-workflow-instance"],
    ).toBe(true);
    expect(
      assessmentGatewayResponse.variables["save-disbursement-schedules"],
    ).toBe(true);
    expect(assessmentGatewayResponse.variables["update-noa-status"]).toBe(true);
    expect(
      assessmentGatewayResponse.variables["update-application-status"],
    ).toBeUndefined();
  });
});
