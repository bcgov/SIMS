import { ProgramInfoStatus } from "@sims/sims-db";
import { WorkflowServiceTasks } from "../..";
import { WorkerMockedData } from "..";

/**
 * Creates the mock for 'Program info required' task.
 * @param options mock options.
 * - `programInfoStatus` program info status expected to be returned.
 * @returns mock for 'Program info required' task.
 */
export function createProgramInfoRequestTaskMock(options: {
  programInfoStatus: ProgramInfoStatus;
}): WorkerMockedData {
  return {
    serviceTaskId: WorkflowServiceTasks.ProgramInfoRequired,
    options: {
      jobCompleteMock: { programInfoStatus: options.programInfoStatus },
    },
  };
}
