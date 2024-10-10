import { ASSESSMENT_ID } from "@sims/services/workflow/variables/assessment-gateway";
import { ApplicationStatus, AssessmentTriggerType } from "@sims/sims-db";
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
} from "../../test-utils";
import {
  createVerifyApplicationExceptionsTaskMock,
  createIncomeRequestTaskMock,
  createCreateSupportingUsersParentsTaskMock,
  createCheckSupportingUserResponseTaskMock,
  createCheckIncomeRequestTaskMock,
  createWorkersMockedData,
  createLoadAssessmentDataTaskMock,
  createVerifyAssessmentCalculationOrderTaskMock,
} from "../../test-utils/mock";
import {
  PROGRAM_YEAR,
  PROGRAM_YEAR_BASE_ID,
} from "../constants/program-year.constants";
import { AssessmentDataType, YesNoOptions } from "@sims/test-utils";
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
      createVerifyApplicationExceptionsTaskMock(),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
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
      createVerifyApplicationExceptionsTaskMock(),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
      }),
      createVerifyAssessmentCalculationOrderTaskMock(),
    ]);

    const currentAssessmentId = assessmentId++;

    // Act
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: "assessment-gateway",
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
      createVerifyApplicationExceptionsTaskMock(),
      createIncomeRequestTaskMock({
        incomeVerificationId: incomeVerificationId++,
        subprocesses: WorkflowSubprocesses.StudentIncomeVerification,
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
      WorkflowSubprocesses.LoadConsolidatedDataPreAssessment,
      WorkflowServiceTasks.VerifyApplicationExceptions,
      WorkflowServiceTasks.ProgramInfoNotRequired,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToNotRequired,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
    );
  });

  it.skip("Should check for both parents incomes when the student is dependant and parents have SIN.", async () => {
    // Arrange
    const currentAssessmentId = assessmentId++;
    const parent1SupportingUserId = supportingUserId++;
    const parent2SupportingUserId = supportingUserId++;
    // Assessment consolidated mocked data.
    const dataOnSubmit: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createParentsData({ numberOfParents: 2 }),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
    };
    const dataPreAssessment: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createParentsData({
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
      createVerifyApplicationExceptionsTaskMock(),
      createCreateSupportingUsersParentsTaskMock({
        supportingUserIds: [parent1SupportingUserId, parent2SupportingUserId],
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
        bpmnProcessId: "assessment-gateway",
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
      WorkflowSubprocesses.RetrieveSupportingInfoParent1,
      WorkflowSubprocesses.RetrieveSupportingInfoParent2,
      WorkflowSubprocesses.Parent1IncomeVerification,
      WorkflowSubprocesses.Parent2IncomeVerification,
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
      ...createParentsData({ numberOfParents: 1 }),
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
      createVerifyApplicationExceptionsTaskMock(),
      createCreateSupportingUsersParentsTaskMock({
        supportingUserIds: [parent1SupportingUserId],
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
        bpmnProcessId: "assessment-gateway",
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
      WorkflowSubprocesses.RetrieveSupportingInfoParent1,
      WorkflowSubprocesses.Parent1IncomeVerification,
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToRequired,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
    );
    expectNotToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowSubprocesses.PartnerIncomeVerification,
      WorkflowSubprocesses.RetrieveSupportingInfoParent2,
      WorkflowSubprocesses.Parent2IncomeVerification,
    );
  });

  it("Should skip parent income verification when the student is dependant and informed that parents do not have SIN.", async () => {
    // Arrange
    const currentAssessmentId = assessmentId++;
    // Assessment consolidated mocked data.
    const dataOnSubmit: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createParentsData({ validSinNumber: YesNoOptions.No }),
      // Application with PIR not required.
      studentDataSelectedOffering: 1,
    };
    const dataPreAssessment: AssessmentConsolidatedData = {
      assessmentTriggerType: AssessmentTriggerType.OriginalAssessment,
      ...createFakeConsolidatedFulltimeData(PROGRAM_YEAR),
      ...createParentsData({
        dataType: AssessmentDataType.PreAssessment,
        validSinNumber: YesNoOptions.No,
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

    // Act
    const assessmentGatewayResponse =
      await zeebeClientProvider.createProcessInstanceWithResult({
        bpmnProcessId: "assessment-gateway",
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
      WorkflowServiceTasks.SaveDisbursementSchedules,
      WorkflowServiceTasks.AssociateMSFAA,
      WorkflowServiceTasks.UpdateNOAStatusToRequired,
      WorkflowServiceTasks.VerifyAssessmentCalculationOrderTask,
    );
    expectNotToPassThroughServiceTasks(
      assessmentGatewayResponse.variables,
      WorkflowSubprocesses.PartnerIncomeVerification,
      WorkflowSubprocesses.RetrieveSupportingInfoParent1,
      WorkflowSubprocesses.Parent1IncomeVerification,
      WorkflowSubprocesses.RetrieveSupportingInfoParent2,
      WorkflowSubprocesses.Parent2IncomeVerification,
    );
  });

  afterAll(async () => {
    await zeebeClientProvider?.close();
  });
});
