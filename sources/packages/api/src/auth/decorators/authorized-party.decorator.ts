import { SetMetadata } from "@nestjs/common";
import { AuthorizedParties } from "../authorized-parties.enum";

export const AUTHORIZED_PARTY_KEY = "authorized-party-key";
export const AllowAuthorizedParty = (
  ...authorizedParties: AuthorizedParties[]
) => SetMetadata(AUTHORIZED_PARTY_KEY, authorizedParties);
