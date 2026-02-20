import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import {
  ApplicationStatus,
  AssessmentTriggerType,
  ProgramInfoStatus,
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
  createParentsData,
  expectNotToPassThroughServiceTasks,
  createIdentifiableParentsData,
  MultiInstanceProcesses,
  createFakeMarriedIndependentStudentData,
} from "../../test-utils";
import {
  createVerifyApplicationExceptionsTaskMock,
  createIncomeRequestTaskMock,
  createCheckSupportingUserResponseTaskMock,
  createCheckIncomeRequestTaskMock,
  createWorkersMockedData,
  createLoadAssessmentDataTaskMock,
  createVerifyAssessmentCalculationOrderTaskMock,
  createIdentifiableParentTaskMock,
  createProgramInfoRequiredTaskMock,
  createProgramInfoNotRequiredTaskMock,
  createIdentifiablePartnerTaskMock,
} from "../../test-utils/mock";
import {
  DEFAULT_ASSESSMENT_GATEWAY,
  PROGRAM_YEAR,
  PROGRAM_YEAR_BASE_ID,
} from "../constants/program-year.constants";
import { AssessmentDataType } from "@sims/test-utils";
import { ZeebeGrpcClient } from "@camunda8/sdk/dist/zeebe";

describe(`E2E Test Workflow assessment gateway on original assessment for ${PROGRAM_YEAR}`, () => {
  let zeebeClientProvider: ZeebeGrpcClient;
  let assessmentId = PROGRAM_YEAR_BASE_ID;
  let supportingUserId = PROGRAM_YEAR_BASE_ID;
  let incomeVerificationId = PROGRAM_YEAR_BASE_ID;

  beforeAll(async () => {
    zeebeClientProvider = ZeebeMockedClient.getMockedZeebeInstance();
  });

  it("Should follow the expected workflow path when student is single and independent without application exception and PIR.", async () => {
    // Arrange

    // Assessment consolidated mocked data.
    const assessmentConsolidatedData: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createFakeSingleIndependentStudentData(),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
    };

    const workersMockedData = createWorkersMockedData([
      createLoadAssessmentDataTaskMock({ assessmentConsolidatedData }),
      createProgramInfoNotRequiredTaskMock(),
      createVerifyApplicationExceptionsTaskMock(),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createCheckIncomeRequestTaskMock({
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createVerifyAssessmentCalculationOrderTaskMock(),
    ]);

    const currentAssessmentId = assessmentId++;

    // Act/Assert
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: DEFAULT_ASSESSMENT_GATEWAY,
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
      WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToRequired,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
    );
  });

  it("Should update NOA status to not required when the application is completed.", async () => {
    // Arrange

    // Assessment consolidated mocked data.
    const assessmentConsolidatedData: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createFakeSingleIndependentStudentData(),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
      applicationStatus: ApplicationStatus.Completed,
    };

    const workersMockedData = createWorkersMockedData([
      createLoadAssessmentDataTaskMock({ assessmentConsolidatedData }),
      createProgramInfoNotRequiredTaskMock(),
      createVerifyApplicationExceptionsTaskMock(),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createCheckIncomeRequestTaskMock({
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createVerifyAssessmentCalculationOrderTaskMock(),
    ]);

    const currentAssessmentId = assessmentId++;

    // Act
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: DEFAULT_ASSESSMENT_GATEWAY,
        variables: {
          [ASSESSMENT_ID]: currentAssessmentId,
          ...workersMockedData,
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });

    // Assert
    expectToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.AssociateWorkflowInstance,
      WorkflowSubprocesses.LoadConsolidatedDataSubmitOrReassessment,
      WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToNotRequiredApplicationCompleted,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
    );
  });

  it("Should update NOA status to not required when there is an NOA approval.", async () => {
    // Arrange

    // Assessment consolidated mocked data.
    const assessmentConsolidatedData: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createFakeSingleIndependentStudentData(),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
      applicationHasNOAApproval: true,
    };

    const workersMockedData = createWorkersMockedData([
      createLoadAssessmentDataTaskMock({ assessmentConsolidatedData }),
      createProgramInfoNotRequiredTaskMock(),
      createVerifyApplicationExceptionsTaskMock(),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createCheckIncomeRequestTaskMock({
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createVerifyAssessmentCalculationOrderTaskMock(),
    ]);

    const currentAssessmentId = assessmentId++;

    // Act/Assert
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: DEFAULT_ASSESSMENT_GATEWAY,
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
      WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToNotRequired,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
    );
  });

  it("Should check for both parents incomes when the student is dependant and parents have SIN.", async () => {
    // Arrange
    const currentAssessmentId = assessmentId++;
    const parent1SupportingUserId = supportingUserId++;
    const parent2SupportingUserId = supportingUserId++;
    // Assessment consolidated mocked data.
    const dataOnSubmit: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createIdentifiableParentsData({ numberOfParents: 2 }),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
    };
    const dataPreAssessment: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createIdentifiableParentsData({
        dataType: AssessmentDataType.PreAssessment,
        numberOfParents: 2,
      }),
    };

    const workersMockedData = createWorkersMockedData([
      createLoadAssessmentDataTaskMock({
        assessmentConsolidatedData: dataOnSubmit,
        subprocess:
          WorkflowSubprocesses.LoadConsolidatedDataSubmitOrReassessment,
      }),
      createLoadAssessmentDataTaskMock({
        assessmentConsolidatedData: dataPreAssessment,
        subprocess: WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      }),
      createProgramInfoNotRequiredTaskMock(),
      createVerifyApplicationExceptionsTaskMock(),
      createIdentifiableParentTaskMock({
        createdSupportingUserId: parent1SupportingUserId,
        parent: 1,
      }),
      createIdentifiableParentTaskMock({
        createdSupportingUserId: parent2SupportingUserId,
        parent: 2,
      }),
      createCheckSupportingUserResponseTaskMock({
        totalIncome: 1,
        subprocesses: WorkflowSubprocesses.RetrieveSupportingInfoParent1,
      }),
      createCheckSupportingUserResponseTaskMock({
        totalIncome: 1,
        subprocesses: WorkflowSubprocesses.RetrieveSupportingInfoParent2,
      }),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.Parent1IncomeVerification,
      }),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.Parent2IncomeVerification,
      }),
      createCheckIncomeRequestTaskMock({
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createCheckIncomeRequestTaskMock({
        subprocesses: WorkflowSubprocesses.Parent1IncomeVerification,
      }),
      createCheckIncomeRequestTaskMock({
        subprocesses: WorkflowSubprocesses.Parent2IncomeVerification,
      }),
      createVerifyAssessmentCalculationOrderTaskMock(),
    ]);

    // Act
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: DEFAULT_ASSESSMENT_GATEWAY,
        variables: {
          [ASSESSMENT_ID]: currentAssessmentId,
          ...workersMockedData,
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });

    // Assert
    expectToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.AssociateWorkflowInstance,
      WorkflowSubprocesses.LoadConsolidatedDataSubmitOrReassessment,
      WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowSubprocesses.StudentIncomeVerification,
      MultiInstanceProcesses.parent1CreateIdentifiableParent,
      MultiInstanceProcesses.parent2CreateIdentifiableParent,
      MultiInstanceProcesses.parent1RetrieveInformation,
      MultiInstanceProcesses.parent2RetrieveInformation,
      MultiInstanceProcesses.parent1IncomeVerification,
      MultiInstanceProcesses.parent2IncomeVerification,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToRequired,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
    );
    expectNotToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowSubprocesses.PartnerIncomeVerification,
    );
  });

  it("Should check for parent 1 income when the student is dependant and informed that he has only one parent with SIN.", async () => {
    // Arrange
    const currentAssessmentId = assessmentId++;
    const parent1SupportingUserId = supportingUserId++;
    // Assessment consolidated mocked data.
    const dataOnSubmit: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createIdentifiableParentsData({ numberOfParents: 1 }),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
    };
    const dataPreAssessment: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createParentsData({
        dataType: AssessmentDataType.PreAssessment,
        numberOfParents: 1,
      }),
    };

    const workersMockedData = createWorkersMockedData([
      createLoadAssessmentDataTaskMock({
        assessmentConsolidatedData: dataOnSubmit,
        subprocess:
          WorkflowSubprocesses.LoadConsolidatedDataSubmitOrReassessment,
      }),
      createLoadAssessmentDataTaskMock({
        assessmentConsolidatedData: dataPreAssessment,
        subprocess: WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      }),
      createProgramInfoNotRequiredTaskMock(),
      createVerifyApplicationExceptionsTaskMock(),
      createIdentifiableParentTaskMock({
        createdSupportingUserId: parent1SupportingUserId,
        parent: 1,
      }),
      createCheckSupportingUserResponseTaskMock({
        totalIncome: 1,
        subprocesses: WorkflowSubprocesses.RetrieveSupportingInfoParent1,
      }),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.Parent1IncomeVerification,
      }),
      createCheckIncomeRequestTaskMock({
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createCheckIncomeRequestTaskMock({
        subprocesses: WorkflowSubprocesses.Parent1IncomeVerification,
      }),
      createVerifyAssessmentCalculationOrderTaskMock(),
    ]);

    // Act
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: DEFAULT_ASSESSMENT_GATEWAY,
        variables: {
          [ASSESSMENT_ID]: currentAssessmentId,
          ...workersMockedData,
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });

    // Assert
    expectToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.AssociateWorkflowInstance,
      WorkflowSubprocesses.LoadConsolidatedDataSubmitOrReassessment,
      WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowSubprocesses.StudentIncomeVerification,
      MultiInstanceProcesses.parent1CreateIdentifiableParent,
      MultiInstanceProcesses.parent1RetrieveInformation,
      MultiInstanceProcesses.parent1IncomeVerification,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToRequired,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
    );
    expectNotToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowSubprocesses.PartnerIncomeVerification,
      MultiInstanceProcesses.parent2CreateIdentifiableParent,
      MultiInstanceProcesses.parent2RetrieveInformation,
      MultiInstanceProcesses.parent2IncomeVerification,
    );
  });

  it("Should end the workflow immediately without verifying exceptions when the PIR is declined.", async () => {
    // Arrange

    // Assessment consolidated mocked data.
    const assessmentConsolidatedData: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createFakeSingleIndependentStudentData(),
      // Application with PIR required.
      studentDataSelectedOffering: null,
      applicationStatus: ApplicationStatus.InProgress,
    };

    const workersMockedData = createWorkersMockedData([
      createLoadAssessmentDataTaskMock({ assessmentConsolidatedData }),
      // PIR declined.
      createProgramInfoRequiredTaskMock({
        programInfoStatus: ProgramInfoStatus.declined,
      }),
    ]);

    const currentAssessmentId = assessmentId++;

    // Act
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: DEFAULT_ASSESSMENT_GATEWAY,
        variables: {
          [ASSESSMENT_ID]: currentAssessmentId,
          ...workersMockedData,
        },
        requestTimeout: PROCESS_INSTANCE_CREATE_TIMEOUT,
      });

    // Assert
    expectToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.AssociateWorkflowInstance,
      WorkflowSubprocesses.LoadConsolidatedDataSubmitOrReassessment,
      WorkflowServiceTasks.ProgramInfoRequired,
      WorkflowServiceTasks.PIRWorkflowWrapUpTask,
    );

    expectNotToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowServiceTasks.VerifyApplicationExceptions,
    );
  });

  it("Should create and load data from a supporting user when the student is married and the partner is able to report.", async () => {
    // Arrange
    const partnerSupportingUserId = supportingUserId++;

    // Assessment consolidated mocked data.
    const assessmentConsolidatedData: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createFakeMarriedIndependentStudentData(),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
    };

    const workersMockedData = createWorkersMockedData([
      createLoadAssessmentDataTaskMock({ assessmentConsolidatedData }),
      createProgramInfoNotRequiredTaskMock(),
      createVerifyApplicationExceptionsTaskMock(),
      createIdentifiablePartnerTaskMock({
        createdSupportingUserId: partnerSupportingUserId,
      }),
      createCheckSupportingUserResponseTaskMock({
        totalIncome: 1,
        subprocesses: WorkflowSubprocesses.RetrieveSupportingInfoPartner,
      }),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.PartnerIncomeVerification,
      }),
      createCheckIncomeRequestTaskMock({
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createCheckIncomeRequestTaskMock({
        subprocesses: WorkflowSubprocesses.PartnerIncomeVerification,
      }),
      createVerifyAssessmentCalculationOrderTaskMock(),
    ]);

    const currentAssessmentId = assessmentId++;

    // Act/Assert
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: DEFAULT_ASSESSMENT_GATEWAY,
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
      WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowServiceTasks.CreateIdentifiablePartnerTask,
      WorkflowSubprocesses.RetrieveSupportingInfoPartner,
      WorkflowSubprocesses.PartnerIncomeVerification,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToRequired,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
    );

    expectNotToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      MultiInstanceProcesses.parent1CreateIdentifiableParent,
      MultiInstanceProcesses.parent1RetrieveInformation,
      MultiInstanceProcesses.parent1IncomeVerification,
    );
  });

  afterAll(async () => {
    await zeebeClientProvider?.close();
  });
});
