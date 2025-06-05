import { getPassthroughTaskId } from "../mock";
import {
  WorkflowMultiInstanceProcesses,
  WorkflowServiceTasks,
  WorkflowSubprocesses,
} from "../constants/workflow-variables-constants";

export class WorkflowMultiInstanceProcess {
  constructor(
    public process: WorkflowMultiInstanceProcesses,
    public loopCounter: number,
    public subprocess: WorkflowSubprocesses | WorkflowServiceTasks,
  ) {}

  getPassthroughValue(workflowResultVariables: unknown): boolean | undefined {
    const passthrough = getPassthroughTaskId(this.subprocess);
    return workflowResultVariables[this.process]?.[this.loopCounter - 1]?.[
      passthrough
    ];
  }
}

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
