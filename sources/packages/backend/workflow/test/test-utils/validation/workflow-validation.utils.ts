import { WorkflowServiceTasks } from "../constants/workflow-variables-constants";
import { WorkflowScopedServiceTask } from "./workflow-validation.models";

/**
 * Expects a workflow based on the workflow result
 * to pass through given service tasks.
 * @param workflowResultVariables workflow result variables
 * @param serviceTasks service tasks to verify.
 */
export function expectToPassThroughServiceTasks(
  workflowResultVariables: unknown,
  ...serviceTasks: WorkflowScopedServiceTask[]
) {
  serviceTasks.forEach((serviceTask) => {
    expect(workflowResultVariables[serviceTask.scopedServiceTaskId]).toBe(true);
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
  ...serviceTasks: WorkflowServiceTasks[]
) {
  serviceTasks.forEach((serviceTask) => {
    expect(workflowResultVariables[serviceTask]).toBeUndefined();
  });
}
