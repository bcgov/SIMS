import { getPassthroughTaskId } from "../mock";
import {
  WorkflowMultiInstanceProcesses,
  WorkflowServiceTasks,
  WorkflowSubprocesses,
} from "../constants/workflow-variables-constants";

/**
 * Represents the information required to assert if a flow passthrough a multi-instance process iteration.
 * It should be used to validate a task or subprocess inside a multi-instance process.
 */
export class WorkflowMultiInstanceProcess {
  /**
   * Create a new instance of WorkflowMultiInstanceProcess.
   * @param process multi-instance process.
   * @param loopCounter current loop counter.
   * @param subprocess subprocess or service task.
   */
  constructor(
    public process: WorkflowMultiInstanceProcesses,
    public loopCounter: number,
    public subprocess: WorkflowSubprocesses | WorkflowServiceTasks,
  ) {}

  /**
   * Get the passthrough value for the current multi-instance process iteration output variables.
   * @param workflowResultVariables workflow result variable.
   * @returns passthrough value for the current multi-instance process iteration output variable.
   */
  getPassthroughValue(workflowResultVariables: unknown): boolean | undefined {
    const passthrough = getPassthroughTaskId(this.subprocess);
    return workflowResultVariables[this.process]?.[this.loopCounter - 1]?.[
      passthrough
    ];
  }
}

/**
 * Available multi-instance processes in the workflow to be asserted.
 */
export class MultiInstanceProcesses {
  static readonly parent1CreateIdentifiableParent =
    new WorkflowMultiInstanceProcess(
      WorkflowMultiInstanceProcesses.IdentifiableParentsCreation,
      1,
      WorkflowServiceTasks.CreateIdentifiableParentTask,
    );
  static readonly parent2CreateIdentifiableParent =
    new WorkflowMultiInstanceProcess(
      WorkflowMultiInstanceProcesses.IdentifiableParentsCreation,
      2,
      WorkflowServiceTasks.CreateIdentifiableParentTask,
    );
  static readonly parent1RetrieveInformation = new WorkflowMultiInstanceProcess(
    WorkflowMultiInstanceProcesses.IdentifiableParentsCreation,
    1,
    WorkflowSubprocesses.RetrieveIdentifiableParentInfo,
  );
  static readonly parent2RetrieveInformation = new WorkflowMultiInstanceProcess(
    WorkflowMultiInstanceProcesses.IdentifiableParentsCreation,
    2,
    WorkflowSubprocesses.RetrieveIdentifiableParentInfo,
  );
  static readonly parent1IncomeVerification = new WorkflowMultiInstanceProcess(
    WorkflowMultiInstanceProcesses.IdentifiableParentsCreation,
    1,
    WorkflowSubprocesses.ParentIncomeVerificationSubprocess,
  );
  static readonly parent2IncomeVerification = new WorkflowMultiInstanceProcess(
    WorkflowMultiInstanceProcesses.IdentifiableParentsCreation,
    2,
    WorkflowSubprocesses.ParentIncomeVerificationSubprocess,
  );
}
