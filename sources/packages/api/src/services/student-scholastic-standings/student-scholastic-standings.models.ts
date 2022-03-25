import { ScholasticStandingStatus } from "../../database/entities";

/**
 * Service model to fetch Pending And Denied scholastic standings.
 */
export interface PendingAndDeniedScholasticStandings {
  submittedDate: Date;
  status: ScholasticStandingStatus;
}
