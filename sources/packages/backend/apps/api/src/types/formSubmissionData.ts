export interface Parent {
  id: number;
  fullName: string;
}

export interface ApplicationWithdrawal {
  applicationNumber: string;
  scholasticStandingId: number;
}

export interface UnderservedCommunity {
  lookupKey: string;
  lookupValue: string;
}
