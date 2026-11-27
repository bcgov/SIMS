import { Injectable } from "@nestjs/common";
import { SystemLookupCategory } from "@sims/sims-db";
import { SupplementaryDataSystemLookupBaseLoader } from ".";
import { KnownSupplementaryDataKey } from "../form-submission.models";

/**
 * Loads the occupations that work in underserved communities from the system lookup configurations.
 */
@Injectable()
export class SupplementaryDataUnderservedCommunityOccupations extends SupplementaryDataSystemLookupBaseLoader<KnownSupplementaryDataKey.UnderservedCommunityOccupations> {
  get dataKey(): KnownSupplementaryDataKey.UnderservedCommunityOccupations {
    return KnownSupplementaryDataKey.UnderservedCommunityOccupations;
  }

  protected get lookupCategory(): SystemLookupCategory {
    return SystemLookupCategory.UnderservedCommunityOccupations;
  }
}
