import { getISODateOnlyString } from "@sims/utilities";
import { IER12IntegrationQueueInDTO } from "../../../models/ier.model";
import {
  mockBullJob,
  MockBullJobResult,
} from "../../../../../../../../test/helpers";

/**
 * Creates the mocked IER12 job payload for the scheduler.
 *  @param options options.
 * - `modifiedSince` Inclusive date since the application or student data was modified.
 * - `institutionCode` Institution code to limit applications to a specific institution.
 * @returns mocked IER12 payload.
 */
export function createIER12SchedulerJobMock(options?: {
  modifiedSince?: string | Date;
  institutionCode?: string;
}): MockBullJobResult<IER12IntegrationQueueInDTO> {
  // Queued job.
  const data = {} as IER12IntegrationQueueInDTO;
  if (options?.modifiedSince) {
    data.modifiedSince = getISODateOnlyString(options.modifiedSince);
  }
  if (options?.institutionCode) {
    data.institutionCode = options.institutionCode;
  }
  return mockBullJob<IER12IntegrationQueueInDTO>(data);
}
