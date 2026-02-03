export class SystemLookupEntryAPIOutDTO {
  lookupKey: string;
  lookupValue: string;
}

export class SystemLookupEntriesAPIOutDTO {
  items: SystemLookupEntryAPIOutDTO[];
}
