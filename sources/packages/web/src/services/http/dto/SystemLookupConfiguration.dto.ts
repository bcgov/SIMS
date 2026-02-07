/**
 * System lookup entry details.
 */
export interface SystemLookupEntryAPIOutDTO {
  lookupKey: string;
  lookupValue: string;
}

/**
 * System lookup entries.
 */
export interface SystemLookupEntriesAPIOutDTO {
  items: SystemLookupEntryAPIOutDTO[];
}
