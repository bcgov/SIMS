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
  WorkflowServiceTasks,
} from "../../test-utils";
import { PROGRAM_YEAR } from "../constants/program-year.constants";

describe(`E2E Test Workflow assessment gateway on original assessment for ${PROGRAM_YEAR}`, () => {
  let zeebeClientProvider: ZBClient;
  beforeAll(async () => {
    zeebeClientProvider = ZeebeMockedClient.getMockedZeebeInstance();
  });

  it("Should follow the expected workflow path when student is single and independent without application exception and PIR.", async () => {
    // Arrange
    const assessmentConsolidatedData =
      createFakeConsolidatedFulltimeData(PROGRAM_YEAR);
    assessmentConsolidatedData.assessmentTriggerType =
      AssessmentTriggerType.OriginalAssessment;

    // Act/Assert
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: "assessment-gateway",
        variables: {
          ...assessmentConsolidatedData,
          [ASSESSMENT_ID]: 1,
          // Based on this variable, load consolidated data worker will
          // provide mock value for student dependent status and relationship status.
          [E2E_STUDENT_STATUS]: "independentSingleStudent",
          // Based on this variable load consolidated data worker will
          // return the application exception status.
          [E2E_APPLICATION_EXCEPTION_STATUS]:
            ApplicationExceptionStatus.Approved,
          // Based on this variable load consolidated data worker will
          // return the application PIR status.
          [E2E_PIR_STATUS]: ProgramInfoStatus.notRequired,
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });
    // Workflow instance expected to pass through associate workflow instance service task.
    expect(
      assessmentGatewayResponse.variables[
        WorkflowServiceTasks.AssociateWorkflowInstance
      ],
    ).toBe(true);
    // Workflow instance expected to pass through verify application exceptions service task.
    expect(
      assessmentGatewayResponse.variables[
        WorkflowServiceTasks.VerifyApplicationExceptions
      ],
    ).toBe(true);
    // Workflow instance expected to pass through program info request not required service task.
    expect(
      assessmentGatewayResponse.variables[
        WorkflowServiceTasks.ProgramInfoNotRequired
      ],
    ).toBe(true);
    // Workflow instance expected to pass through save disbursement schedules service task.
    expect(
      assessmentGatewayResponse.variables[
        WorkflowServiceTasks.SaveDisbursementSchedules
      ],
    ).toBe(true);
    // Workflow instance expected to pass through save associate msfaa service task
    // as this is original assessment.
    expect(
      assessmentGatewayResponse.variables[WorkflowServiceTasks.AssociateMSFAA],
    ).toBe(true);
    // Workflow instance expected to pass through update noa status status to required service task.
    expect(
      assessmentGatewayResponse.variables[
        WorkflowServiceTasks.UpdateNOAStatusToRequired
      ],
    ).toBe(true);
  });
});
