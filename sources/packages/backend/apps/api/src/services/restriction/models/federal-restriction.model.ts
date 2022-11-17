import { Restriction } from "@sims/sims-db";

export class EnsureFederalRestrictionResult {
  restrictions: Restriction[] = [];
  createdRestrictionsCodes: string[] = [];
}

export interface FederalStudentRestrictionInsertedRecord {
  id: number;
  studentId: number;
}
