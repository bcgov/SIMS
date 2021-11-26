import { FedRestrictionFileRecord } from "./fed-restriction-files/fed-restriction-file-record";

export const DATE_FORMAT = "YYYYMMDD";

export interface RestrictionsGrouping {
  [key: string]: FedRestrictionFileRecord[] | undefined;
}
