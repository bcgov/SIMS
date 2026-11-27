import { RestrictionCode } from "@sims/test-utils";

/**
 * Metadata for notification.
 */
export interface NotificationMetadata {
  disbursementId?: number;
  applicationNumber?: string;
  parentApplicationId?: number;
  assessmentId?: number;
  restrictionCode?: RestrictionCode;
}
