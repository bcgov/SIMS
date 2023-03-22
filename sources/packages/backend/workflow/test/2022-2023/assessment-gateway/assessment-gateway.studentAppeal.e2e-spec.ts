import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import { AssessmentTriggerType } from "@sims/sims-db";
import { ZBClient } from "zeebe-node";
import { AssessmentConsolidatedData } from "../../models";
import {
  createFakeConsolidatedFulltimeData,
  ZeebeMockedClient,
  PROCESS_INSTANCE_CREATE_TIMEOUT,
  WorkflowServiceTasks,
  createFakeSingleIndependentStudentData,
  expectToPassthroughServiceTasks,
  expectNotToPassthroughServiceTasks,
} from "../../test-utils";
import { PROGRAM_YEAR } from "../constants/program-year.constants";

describe(`E2E Test Workflow assessment gateway on student appeal for ${PROGRAM_YEAR}`, () => {
  let zeebeClientProvider: ZBClient;
  beforeAll(async () => {
    zeebeClientProvider = ZeebeMockedClient.getMockedZeebeInstance();
  });

  it("Should follow the expected workflow path when student single and independent.", async () => {
    // Arrange
    const assessmentConsolidatedData: AssessmentConsolidatedData = {
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      assessmentTriggerType: AssessmentTriggerType.StudentAppeal,
      ...createFakeSingleIndependentStudentData(),
    };

    // Act/Assert
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: "assessment-gateway",
        variables: {
          [ASSESSMENT_ID]: 1,
          // Data that will be returned by the worker that subscribe to load assessment data service task.
          [`${WorkflowServiceTasks.LoadAssessmentConsolidatedData}-result`]:
            assessmentConsolidatedData,
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });
    expectToPassthroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.AssociateWorkflowInstance,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.UpdateNOAStatusToNotRequired,
    );
    expectNotToPassthroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.UpdateApplicationStatusToInProgress,
      WorkflowServiceTasks.UpdateApplicationStatusToAssessment,
    );
  });
});
