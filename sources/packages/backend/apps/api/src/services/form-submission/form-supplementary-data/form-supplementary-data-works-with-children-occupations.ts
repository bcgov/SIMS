import { Injectable } from "@nestjs/common";
import { SystemLookupCategory } from "@sims/sims-db";
import { SupplementaryDataSystemLookupBaseLoader } from ".";
import { KnownSupplementaryDataKey } from "../form-submission.models";

/**
 * Loads the occupations that work with children from the system lookup configurations.
 */
@Injectable()
export class SupplementaryDataWorksWithChildrenOccupations extends SupplementaryDataSystemLookupBaseLoader<KnownSupplementaryDataKey.WorksWithChildrenOccupations> {
  get dataKey(): KnownSupplementaryDataKey.WorksWithChildrenOccupations {
    return KnownSupplementaryDataKey.WorksWithChildrenOccupations;
  }

  protected get lookupCategory(): SystemLookupCategory {
    return SystemLookupCategory.WorksWithChildrenOccupations;
  }
}
