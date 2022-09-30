import { Restriction } from "@sims/sims-db";

export class EnsureFederalRestrictionResult {
  restrictions: Restriction[] = [];
  createdRestrictionsCodes: string[] = [];
}
