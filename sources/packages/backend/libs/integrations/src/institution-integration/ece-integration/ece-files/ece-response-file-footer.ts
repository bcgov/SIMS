import { ECEResponseFileRecord } from "./ece-response-file-record";

export class ECEResponseFileFooter extends ECEResponseFileRecord {
  constructor(line: string) {
    super(line);
  }

  get totalDetailRecords(): number {
    return +this.line.substring(1, 7);
  }
}
