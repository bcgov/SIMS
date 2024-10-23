import { CASAuthDetails } from "@sims/integrations/cas/models/cas-service.model";
import * as dayjs from "dayjs";

/**
 * Default amount of time to a token be expired and be
 * considered candidate to be renewed.
 */
const CAS_TOKEN_RENEWAL_SECONDS = 60;

/**
 * Cache the CAS token to be reused.
 */
export class CASCachedAuthDetails {
  private readonly renewalTime: Date;
  constructor(readonly authDetails: CASAuthDetails) {
    this.renewalTime = dayjs()
      .add(authDetails.expires_in - CAS_TOKEN_RENEWAL_SECONDS, "seconds")
      .toDate();
  }

  /**
   * Indicates if the token requires renewal.
   * @returns true if must be renewed, otherwise false.
   */
  requiresRenewal(): boolean {
    return dayjs().isAfter(this.renewalTime);
  }
}
