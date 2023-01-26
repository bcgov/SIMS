import { IdentityProviders } from "@sims/sims-db";
import { IUserToken } from ".";

/**
 * The token received from Keycloak will contains one of the 3 possible
 * identity provider: bcsc, idir or bceidboth. When the bceidboth is used
 * this methods defines if the user is associated with a business BCeID
 * checking if there an business GUID information.
 * @param userInfo user information with the identity provider and the
 * BCeID business GUID, if present.
 * @returns
 */
export function evaluateSpecificIdentityProvider(
  userInfo: Pick<IUserToken, "identityProvider" | "bceidBusinessGuid">,
):
  | IdentityProviders.BCSC
  | IdentityProviders.BCeIDBasic
  | IdentityProviders.BCeIDBusiness
  | IdentityProviders.IDIR {
  if (userInfo.identityProvider === IdentityProviders.BCeIDBoth) {
    return !!userInfo.bceidBusinessGuid
      ? IdentityProviders.BCeIDBusiness
      : IdentityProviders.BCeIDBasic;
  }
  if (
    [IdentityProviders.BCeIDBasic, IdentityProviders.BCeIDBusiness].includes(
      userInfo.identityProvider,
    )
  ) {
    throw new Error(
      `${IdentityProviders.BCeIDBasic} or ${IdentityProviders.BCeIDBusiness} are not expected identity providers.`,
    );
  }
  return userInfo.identityProvider;
}
