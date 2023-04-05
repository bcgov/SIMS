import {
  WorkflowServiceTasks,
  WorkflowSubprocesses,
} from "../constants/workflow-variables-constants";

export type WorkflowExpectedTask = WorkflowServiceTasks | WorkflowSubprocesses;

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
    expect(workflowResultVariables[expectedTask]).toBe(expectedTask);
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
    expect(workflowResultVariables[expectedTask]).toBeUndefined();
  });
}
