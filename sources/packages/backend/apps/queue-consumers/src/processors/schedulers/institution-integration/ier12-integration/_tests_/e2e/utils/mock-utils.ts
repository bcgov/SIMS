import { getISODateOnlyString } from "@sims/utilities";
import { GeneratedDateQueueInDTO } from "../../../models/ier.model";
import {
  mockBullJob,
  MockBullJobResult,
} from "../../../../../../../../test/helpers";

/**
 * Creates the mocked IER12 job payload for the scheduler.
 * @param date optional date of processing.
 * @returns mocked IER12 payload.
 */
export function createIER12SchedulerJobMock(
  date?: string | Date,
): MockBullJobResult<GeneratedDateQueueInDTO> {
  // Queued job.
  const data = {} as GeneratedDateQueueInDTO;
  if (date) {
    data.generatedDate = getISODateOnlyString(date);
  }
  return mockBullJob<GeneratedDateQueueInDTO>(data);
}
