import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  ApplicationEditStatus,
  ApplicationStatus,
  AssessmentTriggerType,
} from "@sims/sims-db";
import { AssessmentConsolidatedData } from "../../models";
import {
  createFakeConsolidatedFulltimeData,
  ZeebeMockedClient,
  PROCESS_INSTANCE_CREATE_TIMEOUT,
  WorkflowServiceTasks,
  createFakeSingleIndependentStudentData,
  expectToPassThroughServiceTasks,
  WorkflowSubprocesses,
  expectNotToPassThroughServiceTasks,
} from "../../test-utils";
import {
  createVerifyApplicationExceptionsTaskMock,
  createIncomeRequestTaskMock,
  createWorkersMockedData,
  createLoadAssessmentDataTaskMock,
  createVerifyAssessmentCalculationOrderTaskMock,
  createApplicationChangeRequestApprovalTaskMock,
} from "../../test-utils/mock";
import {
  PROGRAM_YEAR,
  PROGRAM_YEAR_BASE_ID,
} from "../constants/program-year.constants";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";

describe(`E2E Test Workflow assessment gateway on change requests for ${PROGRAM_YEAR}`, () => {
  let zeebeClientProvider: ZeebeGrpcClient;
  let assessmentId = PROGRAM_YEAR_BASE_ID;
  let incomeVerificationId = PROGRAM_YEAR_BASE_ID;

  beforeAll(async () => {
    zeebeClientProvider = ZeebeMockedClient.getMockedZeebeInstance();
  });

  it.skip("Should complete the assessment calculations when a change request was approved by the Ministry and a message was sent to the workflow.", async () => {
    // Arrange

    // Assessment consolidated mocked data.
    const assessmentConsolidatedData: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createFakeSingleIndependentStudentData(),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
      applicationStatus: ApplicationStatus.Completed,
      applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
    };

    const workersMockedData = createWorkersMockedData([
      createLoadAssessmentDataTaskMock({ assessmentConsolidatedData }),
      createVerifyApplicationExceptionsTaskMock(),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createApplicationChangeRequestApprovalTaskMock({
        applicationEditStatus: ApplicationEditStatus.ChangePendingApproval,
      }),
      createVerifyAssessmentCalculationOrderTaskMock(),
    ]);

    const currentAssessmentId = assessmentId++;

    // Act/Assert
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: "assessment-gateway",
        variables: {
          [ASSESSMENT_ID]: currentAssessmentId,
          ...workersMockedData,
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });
    expectToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.AssociateWorkflowInstance,
      WorkflowSubprocesses.LoadConsolidatedDataSubmitOrReassessment,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowServiceTasks.ApplicationChangeRequestApproval,
    );
    expectNotToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoRequired,
      WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToRequired,
      WorkflowServiceTasks.UpdateApplicationStatusToAssessment,
    );
  });

  it("Should end the assessment workflow when a change request is declined by the Ministry.", async () => {
    // Arrange

    // Assessment consolidated mocked data.
    const assessmentConsolidatedData: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createFakeSingleIndependentStudentData(),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
      applicationStatus: ApplicationStatus.Completed,
      applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
    };

    const workersMockedData = createWorkersMockedData([
      createLoadAssessmentDataTaskMock({ assessmentConsolidatedData }),
      createVerifyApplicationExceptionsTaskMock(),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createApplicationChangeRequestApprovalTaskMock({
        applicationEditStatus: ApplicationEditStatus.ChangeDeclined,
      }),
    ]);

    const currentAssessmentId = assessmentId++;

    // Act/Assert
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: "assessment-gateway",
        variables: {
          [ASSESSMENT_ID]: currentAssessmentId,
          ...workersMockedData,
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });
    expectToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.AssociateWorkflowInstance,
      WorkflowSubprocesses.LoadConsolidatedDataSubmitOrReassessment,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowServiceTasks.ApplicationChangeRequestApproval,
    );
    expectNotToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoRequired,
      WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToRequired,
      WorkflowServiceTasks.UpdateApplicationStatusToAssessment,
    );
  });

  afterAll(async () => {
    await zeebeClientProvider?.close();
  });
});
