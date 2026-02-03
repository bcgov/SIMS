/**
 * System lookup entry details.
 */
export class SystemLookupEntryAPIOutDTO {
  lookupKey: string;
  lookupValue: string;
}

/**
 * System lookup entries.
 */
export class SystemLookupEntriesAPIOutDTO {
  items: SystemLookupEntryAPIOutDTO[];
}
