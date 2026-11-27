import { Injectable } from "@nestjs/common";
import { SystemLookupCategory } from "@sims/sims-db";
import { SupplementaryDataSystemLookupBaseLoader } from ".";
import { KnownSupplementaryDataKey } from "../form-submission.models";

/**
 * Loads the employer categories from the system lookup configurations.
 */
@Injectable()
export class SupplementaryDataEmployerCategories extends SupplementaryDataSystemLookupBaseLoader<KnownSupplementaryDataKey.EmployerCategories> {
  get dataKey(): KnownSupplementaryDataKey.EmployerCategories {
    return KnownSupplementaryDataKey.EmployerCategories;
  }

  protected get lookupCategory(): SystemLookupCategory {
    return SystemLookupCategory.EmployerCategory;
  }
}
