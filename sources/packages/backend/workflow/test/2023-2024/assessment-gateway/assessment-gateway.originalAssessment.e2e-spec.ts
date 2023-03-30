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
  createMockedWorkerResult,
  createVerifyApplicationExceptionsTaskMock,
  createIncomeRequestTaskMock,
  createCreateSupportingUsersParentsTaskMock,
  createCheckSupportingUserResponseTaskMock,
  createFakeConsolidateDataForTwoParentsPreAssessmentDate,
  createCheckIncomeRequestTaskMock,
  WorkflowSubprocesses,
} from "../../test-utils";
import { PROGRAM_YEAR } from "../constants/program-year.constants";

describe(`E2E Test Workflow assessment gateway on original assessment for ${PROGRAM_YEAR}`, () => {
  let zeebeClientProvider: ZBClient;
  let assessmentId = 1;
  let supportingUserId = 1;
  let incomeVerificationId = 1;

  beforeAll(async () => {
    zeebeClientProvider = ZeebeMockedClient.getMockedZeebeInstance();
  });

  it("Should follow the expected workflow path when student is single and independent without application exception and PIR.", async () => {
    // Arrange

    // Assessment consolidated mocked data.
    const assessmentConsolidatedData: AssessmentConsolidatedData = {
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeSingleIndependentStudentData(),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
    };
    const assessmentConsolidatedMock = createMockedWorkerResult(
      WorkflowServiceTasks.LoadAssessmentConsolidatedData,
      {
        jobCompleteMock: assessmentConsolidatedData,
      },
    );
    const currentAssessmentId = assessmentId++;

    // Act/Assert
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: "assessment-gateway",
        variables: {
          [ASSESSMENT_ID]: currentAssessmentId,
          ...assessmentConsolidatedMock,
          ...createVerifyApplicationExceptionsTaskMock(),
          ...createIncomeRequestTaskMock({
            incomeVerificationId: incomeVerificationId++,
            subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
          }),
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });
    expectToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.AssociateWorkflowInstance,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToRequired,
    );
  });

  it("Should check for both parents incomes when the student is dependant and parents have SIN.", async () => {
    // Arrange
    const currentAssessmentId = assessmentId++;
    const parent1SupportingUserId = supportingUserId++;
    const parent2SupportingUserId = supportingUserId++;
    // Assessment consolidated mocked data.
    const assessmentConsolidatedMock = createMockedWorkerResult(
      WorkflowServiceTasks.LoadAssessmentConsolidatedData,
      {
        jobCompleteMock:
          createFakeConsolidateDataForTwoParentsPreAssessmentDate(),
      },
    );

    const assessmentStartData = {
      bpmnProcessId: "assessment-gateway",
      variables: {
        [ASSESSMENT_ID]: currentAssessmentId,
        ...assessmentConsolidatedMock,
        ...createVerifyApplicationExceptionsTaskMock(),
        ...createCreateSupportingUsersParentsTaskMock({
          supportingUserIds: [parent1SupportingUserId, parent2SupportingUserId],
        }),
        ...createCheckSupportingUserResponseTaskMock({
          supportingUserId: parent1SupportingUserId,
          totalIncome: 1,
          subprocesses: WorkflowSubprocesses.RetrieveSupportingInfoParent1,
        }),
        ...createCheckSupportingUserResponseTaskMock({
          supportingUserId: parent2SupportingUserId,
          totalIncome: 1,
          subprocesses: WorkflowSubprocesses.RetrieveSupportingInfoParent2,
        }),
        ...createIncomeRequestTaskMock({
          incomeVerificationId: incomeVerificationId++,
          subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
        }),
        ...createIncomeRequestTaskMock({
          incomeVerificationId: incomeVerificationId++,
          subprocesses: WorkflowSubprocesses.Parent1IncomeVerification,
        }),
        ...createIncomeRequestTaskMock({
          incomeVerificationId: incomeVerificationId++,
          subprocesses: WorkflowSubprocesses.Parent2IncomeVerification,
        }),
        ...createCheckIncomeRequestTaskMock({
          subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
        }),
        ...createCheckIncomeRequestTaskMock({
          subprocesses: WorkflowSubprocesses.Parent1IncomeVerification,
        }),
        ...createCheckIncomeRequestTaskMock({
          subprocesses: WorkflowSubprocesses.Parent2IncomeVerification,
        }),
      },
      requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
    };

    // Act
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult(
        assessmentStartData,
      );

    // Assert
    expectToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.AssociateWorkflowInstance,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowSubprocesses.StudentIncomeVerification,
      WorkflowSubprocesses.RetrieveSupportingInfoParent1,
      WorkflowSubprocesses.RetrieveSupportingInfoParent2,
      WorkflowSubprocesses.Parent1IncomeVerification,
      WorkflowSubprocesses.Parent2IncomeVerification,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToRequired,
    );
  });

  afterAll(async () => {
    await zeebeClientProvider?.close();
  });
});
