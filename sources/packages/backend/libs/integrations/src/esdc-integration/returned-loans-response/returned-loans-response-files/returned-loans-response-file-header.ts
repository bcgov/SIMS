import { ReturnedLoansResponseFileRecord } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-record";

/**
 * Returned loans response file header.
 */
export class ReturnedLoansResponseFileHeader extends ReturnedLoansResponseFileRecord {
  constructor(line: string) {
    super(line);
  }
}
