export interface StudentRestrictionStatus {
  hasRestriction: boolean;
  hasFederalRestriction: boolean;
  hasProvincialRestriction: boolean;
  restrictionMessage: string;
}

export interface AssessSINRestrictionResult {
  newSINRestrictionId: number;
  sinRestrictionNotificationId: number;
}
