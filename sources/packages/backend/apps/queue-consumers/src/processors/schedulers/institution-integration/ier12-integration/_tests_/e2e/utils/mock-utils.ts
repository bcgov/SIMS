import { getISODateOnlyString } from "@sims/utilities";
import { IER12IntegrationQueueInDTO } from "../../../models/ier.model";
import {
  mockBullJob,
  MockBullJobResult,
} from "../../../../../../../../test/helpers";

/**
 * Creates the mocked IER12 job payload for the scheduler.
 * @param modifiedSince Include modifications to IER12 related data made since this date (inclusive).
 * @param institutionCode Institution code to limit applications to a specific institution.
 * @returns mocked IER12 payload.
 */
export function createIER12SchedulerJobMock(
  modifiedSince?: string | Date,
  institutionCode?: string,
): MockBullJobResult<IER12IntegrationQueueInDTO> {
  // Queued job.
  const data = {} as IER12IntegrationQueueInDTO;
  if (modifiedSince) {
    data.modifiedSince = getISODateOnlyString(modifiedSince);
  }
  data.institutionCode = institutionCode;
  return mockBullJob<IER12IntegrationQueueInDTO>(data);
}
