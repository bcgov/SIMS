import { Injectable } from "@nestjs/common";
import { SystemLookupCategory } from "@sims/sims-db";
import { SupplementaryDataSystemLookupBaseLoader } from ".";
import { KnownSupplementaryDataKey } from "../form-submission.models";

/**
 * Loads the employer categories from the system lookup configurations.
 */
@Injectable()
export class SupplementaryDataEmployers extends SupplementaryDataSystemLookupBaseLoader<KnownSupplementaryDataKey.Employers> {
  get dataKey(): KnownSupplementaryDataKey.Employers {
    return KnownSupplementaryDataKey.Employers;
  }

  protected get lookupCategory(): SystemLookupCategory {
    return SystemLookupCategory.EmployerCategory;
  }
}
