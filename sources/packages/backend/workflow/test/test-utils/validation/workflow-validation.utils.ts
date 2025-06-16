import { WorkflowMultiInstanceProcess } from "..";
import {
  WorkflowServiceTasks,
  WorkflowSubprocesses,
} from "../constants/workflow-variables-constants";
import { getPassthroughTaskId } from "../mock";

export type WorkflowExpectedTask =
  | WorkflowServiceTasks
  | WorkflowSubprocesses
  | WorkflowMultiInstanceProcess;

/**
 * Expects a workflow based on the workflow result
 * to pass through given service tasks.
 * @param workflowResultVariables workflow result variables
 * @param serviceTasks service tasks to verify.
 */
export function expectToPassThroughServiceTasks(
  workflowResultVariables: unknown,
  ...expectedTasks: WorkflowExpectedTask[]
) {
  expectedTasks.forEach((expectedTask) => {
    // Multi-instance processes validation.
    if (expectedTask instanceof WorkflowMultiInstanceProcess) {
      expect(expectedTask.getPassthroughValue(workflowResultVariables)).toBe(
        expectedTask.subprocess,
      );
      return;
    }
    // Non-multi-instance processes validation.
    expect(workflowResultVariables[getPassthroughTaskId(expectedTask)]).toBe(
      expectedTask,
    );
  });
}

/**
 * Expects a workflow based on the workflow result
 * to NOT pass through given service tasks.
 * @param workflowResultVariables workflow result variables
 * @param serviceTasks service tasks to verify.
 */
export function expectNotToPassThroughServiceTasks(
  workflowResultVariables: unknown,
  ...expectedTasks: WorkflowExpectedTask[]
) {
  expectedTasks.forEach((expectedTask) => {
    // Multi-instance processes or task validation.
    if (expectedTask instanceof WorkflowMultiInstanceProcess) {
      expect(
        expectedTask.getPassthroughValue(workflowResultVariables),
      ).toBeUndefined();
      return;
    }
    // Non-multi-instance processes validation.
    expect(
      workflowResultVariables[getPassthroughTaskId(expectedTask)],
    ).toBeUndefined();
  });
}
