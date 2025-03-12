import {
  APPLICATION_ID,
  ASSESSMENT_ID,
} from "@sims/services/workflow/variables/assessment-gateway";
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
  let applicationId = PROGRAM_YEAR_BASE_ID;
  let assessmentId = PROGRAM_YEAR_BASE_ID;
  let incomeVerificationId = PROGRAM_YEAR_BASE_ID;

  beforeAll(async () => {
    zeebeClientProvider = ZeebeMockedClient.getMockedZeebeInstance();
  });

  it("Should complete the assessment calculations when a change request was approved by the Ministry and a message was sent to the workflow.", async () => {
    // Arrange
    const currentAssessmentId = assessmentId++;
    const currentApplicationId = applicationId++;

    // Assessment consolidated mocked data.
    const dataOnSubmit: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createFakeSingleIndependentStudentData(),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
      applicationStatus: ApplicationStatus.Edited,
      applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
      [APPLICATION_ID]: currentApplicationId,
    };

    const dataPreAssessment: AssessmentConsolidatedData = {
      ...dataOnSubmit,
      applicationStatus: ApplicationStatus.Completed,
      applicationEditStatus: ApplicationEditStatus.ChangedWithApproval,
    };

    const workersMockedData = createWorkersMockedData([
      createLoadAssessmentDataTaskMock({
        assessmentConsolidatedData: dataOnSubmit,
      }),
      createLoadAssessmentDataTaskMock({
        assessmentConsolidatedData: dataPreAssessment,
        subprocess: WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      }),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createApplicationChangeRequestApprovalTaskMock({
        applicationId: currentApplicationId,
      }),
      createVerifyAssessmentCalculationOrderTaskMock(),
    ]);

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
      WorkflowSubprocesses.StudentIncomeVerification,
      WorkflowServiceTasks.ApplicationChangeRequestApproval,
      WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToNotRequiredApplicationCompleted,
      WorkflowServiceTasks.WorkflowWrapUpTask,
    );
    expectNotToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoRequired,
      WorkflowServiceTasks.UpdateApplicationStatusToAssessment,
    );
  });

  it("Should end the assessment workflow when a change request is declined by the Ministry.", async () => {
    // Arrange
    const currentAssessmentId = assessmentId++;
    const currentApplicationId = applicationId++;

    // Assessment consolidated mocked data.
    const assessmentConsolidatedData: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createFakeSingleIndependentStudentData(),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
      applicationStatus: ApplicationStatus.Edited,
      applicationEditStatus: ApplicationEditStatus.ChangeInProgress,
      [APPLICATION_ID]: currentApplicationId,
    };

    const workersMockedData = createWorkersMockedData([
      createLoadAssessmentDataTaskMock({ assessmentConsolidatedData }),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createApplicationChangeRequestApprovalTaskMock({
        applicationId: currentApplicationId,
        messageApplicationEditStatus: ApplicationEditStatus.ChangeDeclined,
      }),
    ]);

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
      WorkflowSubprocesses.StudentIncomeVerification,
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
      WorkflowServiceTasks.UpdateNOAStatusToNotRequiredApplicationCompleted,
      WorkflowServiceTasks.WorkflowWrapUpTask,
    );
  });

  afterAll(async () => {
    await zeebeClientProvider?.close();
  });
});
