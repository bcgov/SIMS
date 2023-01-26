import { IdentityProviders, SpecificIdentityProviders } from "@sims/sims-db";
import { IUserToken } from ".";

/**
 * The token received from Keycloak will contains one of the three possible
 * identity provider: bcsc, idir or bceidboth. When the bceidboth is used,
 * this method defines if the user is associated with a business BCeID
 * checking if there is an business GUID information.
 * @param userInfo identity provider and the BCeID business GUID, if present.
 * @returns the specific identity provider that executed the user authentication.
 */
export function evaluateSpecificIdentityProvider(
  userInfo: Pick<IUserToken, "identityProvider" | "bceidBusinessGuid">,
): SpecificIdentityProviders {
  if (userInfo.identityProvider === IdentityProviders.BCeIDBoth) {
    return !!userInfo.bceidBusinessGuid
      ? IdentityProviders.BCeIDBusiness
      : IdentityProviders.BCeIDBasic;
  }
  return userInfo.identityProvider;
}
