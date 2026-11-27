import { Injectable } from "@nestjs/common";
import { SystemLookupCategory } from "@sims/sims-db";
import { SupplementaryDataSystemLookupBaseLoader } from ".";
import { KnownSupplementaryDataKey } from "../form-submission.models";

/**
 * Loads the underserved communities from the system lookup configurations.
 */
@Injectable()
export class SupplementaryDataUnderservedCommunities extends SupplementaryDataSystemLookupBaseLoader<KnownSupplementaryDataKey.UnderservedCommunities> {
  get dataKey(): KnownSupplementaryDataKey.UnderservedCommunities {
    return KnownSupplementaryDataKey.UnderservedCommunities;
  }

  protected get lookupCategory(): SystemLookupCategory {
    return SystemLookupCategory.UnderservedCommunity;
  }
}
