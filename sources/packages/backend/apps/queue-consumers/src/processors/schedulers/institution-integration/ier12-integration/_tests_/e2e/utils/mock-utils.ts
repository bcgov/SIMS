import { DeepMocked, createMock } from "@golevelup/ts-jest";
import { getISODateOnlyString } from "@sims/utilities";
import { Job } from "bull";
import { GeneratedDateQueueInDTO } from "../../../models/ier.model";

/**
 * Creates the mocked IER12 job payload for the scheduler.
 * @param date optional date of processing.
 * @returns mocked IER12 payload.
 */
export function createIER12SchedulerJobMock(
  date?: string | Date,
): DeepMocked<Job<GeneratedDateQueueInDTO>> {
  // Queued job payload.
  const data = {} as GeneratedDateQueueInDTO;
  if (date) {
    data.generatedDate = getISODateOnlyString(date);
  }
  // Queued job.
  return createMock<Job<GeneratedDateQueueInDTO>>({ data });
}
