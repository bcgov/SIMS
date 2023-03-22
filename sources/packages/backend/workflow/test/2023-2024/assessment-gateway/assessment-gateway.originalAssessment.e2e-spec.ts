import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  ApplicationExceptionStatus,
  AssessmentTriggerType,
} from "@sims/sims-db";
import { ZBClient } from "zeebe-node";
import { AssessmentConsolidatedData } from "../../models";
import {
  createFakeConsolidatedFulltimeData,
  ZeebeMockedClient,
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

    const loadAssessmentConsolidatedDataResult: Partial<AssessmentConsolidatedData> =
      {
        // Single independent student.
        studentDataDependantstatus: "independant",
        studentDataRelationshipStatus: "single",
        studentDataTaxReturnIncome: 40000,
        // Application with no exception.
        applicationExceptionStatus: ApplicationExceptionStatus.Approved,
        // Application with PIR not required.
        studentDataSelectedOffering: 1,
      };

    // Act/Assert
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: "assessment-gateway",
        variables: {
          ...assessmentConsolidatedData,
          [ASSESSMENT_ID]: 1,
          // Data that will be returned by the worker that subscribe to load assessment data service task.
          [`${WorkflowServiceTasks.LoadAssessmentConsolidatedData}-result`]:
            loadAssessmentConsolidatedDataResult,
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
