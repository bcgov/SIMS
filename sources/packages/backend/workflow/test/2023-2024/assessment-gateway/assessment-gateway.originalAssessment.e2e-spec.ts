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
  WorkflowParentScopes,
  ExpectedServiceTasks,
  createCreateSupportingUsersParentsTaskMock,
  createCheckSupportingUserResponseTaskMock,
  createFakeConsolidateDataForTwoParentsPreAssessmentDate,
  createCheckIncomeRequestTaskMock,
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
            scope: WorkflowParentScopes.IncomeVerificationStudent,
          }),
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });
    expectToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      ExpectedServiceTasks.associateWorkflowInstance,
      ExpectedServiceTasks.verifyApplicationExceptions,
      ExpectedServiceTasks.programInfoNotRequired,
      ExpectedServiceTasks.saveDisbursementSchedules,
      ExpectedServiceTasks.associateMSFAA,
      ExpectedServiceTasks.updateNOAStatusToRequired,
    );
  });

  it.only("Should check for both parents incomes when the student is dependant and parents have SIN.", async () => {
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
          scope: WorkflowParentScopes.RetrieveSupportingInfoParent1,
        }),
        ...createCheckSupportingUserResponseTaskMock({
          supportingUserId: parent2SupportingUserId,
          totalIncome: 1,
          scope: WorkflowParentScopes.RetrieveSupportingInfoParent2,
        }),
        ...createIncomeRequestTaskMock({
          incomeVerificationId: incomeVerificationId++,
          scope: WorkflowParentScopes.IncomeVerificationStudent,
        }),
        ...createIncomeRequestTaskMock({
          incomeVerificationId: incomeVerificationId++,
          scope: WorkflowParentScopes.IncomeVerificationParent1,
        }),
        ...createIncomeRequestTaskMock({
          incomeVerificationId: incomeVerificationId++,
          scope: WorkflowParentScopes.IncomeVerificationParent2,
        }),
        ...createCheckIncomeRequestTaskMock({
          scope: WorkflowParentScopes.IncomeVerificationStudent,
        }),
        ...createCheckIncomeRequestTaskMock({
          scope: WorkflowParentScopes.IncomeVerificationParent1,
        }),
        ...createCheckIncomeRequestTaskMock({
          scope: WorkflowParentScopes.IncomeVerificationParent2,
        }),
      },
      requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
    };

    // Act
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult(
        assessmentStartData,
      );

    console.log(JSON.stringify(assessmentGatewayResponse));
    console.log(
      "TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST-TEST",
    );

    // Assert
    expectToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      ExpectedServiceTasks.associateWorkflowInstance,
      ExpectedServiceTasks.verifyApplicationExceptions,
      ExpectedServiceTasks.programInfoNotRequired,
      ExpectedServiceTasks.saveDisbursementSchedules,
      ExpectedServiceTasks.associateMSFAA,
      ExpectedServiceTasks.updateNOAStatusToRequired,
    );
  });

  afterAll(async () => {
    await zeebeClientProvider?.close();
  });
});
