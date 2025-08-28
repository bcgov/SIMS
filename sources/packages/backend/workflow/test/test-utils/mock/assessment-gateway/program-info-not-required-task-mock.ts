import { ProgramInfoStatus } from "@sims/sims-db";
import { WorkflowServiceTasks } from "../..";
import { WorkerMockedData } from "..";

/**
 * Creates the mock for 'Program info not required' task.
 * @returns mock for 'Program info not required' task.
 */
export function createProgramInfoNotRequiredTaskMock(): WorkerMockedData {
  return {
    serviceTaskId: WorkflowServiceTasks.ProgramInfoNotRequired,
    options: {
      jobCompleteMock: {
        programInfoStatus: ProgramInfoStatus.notRequired,
      },
    },
  };
}
