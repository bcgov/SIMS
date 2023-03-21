import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import { AssessmentTriggerType } from "@sims/sims-db";
import { ZBClient } from "zeebe-node";
import {
  createFakeConsolidatedFulltimeData,
  ZeebeMockedClient,
  E2E_STUDENT_STATUS,
  PROCESS_INSTANCE_CREATE_TIMEOUT,
  Workers,
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

    // Act/Assert
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
    // Workflow instance expected to pass through associate workflow instance worker.
    expect(
      assessmentGatewayResponse.variables[Workers.AssociateWorkflowInstance],
    ).toBe(true);
    // Workflow instance expected to pass through save disbursement schedules worker.
    expect(
      assessmentGatewayResponse.variables[Workers.SaveDisbursementSchedules],
    ).toBe(true);
    // Workflow instance expected to pass through update noa status worker.
    expect(assessmentGatewayResponse.variables[Workers.UpdateNOAStatus]).toBe(
      true,
    );
    // Workflow instance expected to not pass through update application status worker
    // as this is a reassessment.
    expect(
      assessmentGatewayResponse.variables[Workers.UpdateApplicationStatus],
    ).toBeUndefined();
  });
});
