export interface Parent {
  id: number;
  fullName: string;
}

export interface ApplicationWithdrawal {
  applicationNumber: string;
  scholasticStandingId: number;
}

/**
 * System lookup item, as loaded by the supplementary data loaders.
 */
export interface SystemLookupItem {
  lookupKey: string;
  lookupValue: string;
}
