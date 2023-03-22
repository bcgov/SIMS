import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import { AssessmentTriggerType } from "@sims/sims-db";
import { ZBClient } from "zeebe-node";
import {
  createFakeConsolidatedFulltimeData,
  ZeebeMockedClient,
  E2E_STUDENT_STATUS,
  PROCESS_INSTANCE_CREATE_TIMEOUT,
  WorkflowServiceTasks,
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
    // Workflow instance expected to pass through associate workflow instance service task.
    expect(
      assessmentGatewayResponse.variables[
        WorkflowServiceTasks.AssociateWorkflowInstance
      ],
    ).toBe(true);
    // Workflow instance expected to pass through save disbursement schedules service task.
    expect(
      assessmentGatewayResponse.variables[
        WorkflowServiceTasks.SaveDisbursementSchedules
      ],
    ).toBe(true);
    // Workflow instance expected to pass through update noa status to not required service task.
    expect(
      assessmentGatewayResponse.variables[
        WorkflowServiceTasks.UpdateNOAStatusToNotRequired
      ],
    ).toBe(true);
    // Workflow instance expected to not pass through update application status to in progress service task
    // as this is a reassessment.
    expect(
      assessmentGatewayResponse.variables[
        WorkflowServiceTasks.UpdateApplicationStatusToInProgress
      ],
    ).toBeUndefined();
    // Workflow instance expected to not pass through update application status to assessment service task
    // as this is a reassessment.
    expect(
      assessmentGatewayResponse.variables[
        WorkflowServiceTasks.UpdateApplicationStatusToAssessment
      ],
    ).toBeUndefined();
  });
});
