import { Restriction } from "../../../database/entities";

export class EnsureFederalRestrictionResult {
  restrictions: Restriction[] = [];
  createdRestrictionsCodes: string[] = [];
}
