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
  expectToPassThroughServiceTasks,
  expectNotToPassThroughServiceTasks,
} from "../../test-utils";
import { PROGRAM_YEAR } from "../constants/program-year.constants";
import {
  createLoadAssessmentConsolidatedDataMock,
  createMockedWorkerResult,
} from "../../test-utils/mock";

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
          ...createLoadAssessmentConsolidatedDataMock({
            assessmentConsolidatedData,
          }),
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });
    expectToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.AssociateWorkflowInstance,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToNotRequired,
    );
    expectNotToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.UpdateApplicationStatusToInProgress,
      WorkflowServiceTasks.UpdateApplicationStatusToAssessment,
    );
  });
});
