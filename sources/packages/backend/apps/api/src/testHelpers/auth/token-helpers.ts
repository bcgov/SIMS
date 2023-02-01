import { UserPasswordCredential } from "@sims/utilities/config";
import { AuthorizedParties, KeycloakConfig } from "../../auth";
import { KeycloakService } from "../../services";

function getCredentials(
  authorizedParty: AuthorizedParties,
): UserPasswordCredential {
  switch (authorizedParty) {
    case AuthorizedParties.aest:
      return {
        userName: process.env.E2E_TEST_MINISTRY_USERNAME,
        password: process.env.E2E_TEST_MINISTRY_PASSWORD,
      };
    default:
      throw new Error(
        `Credentials not defined for client authorized party ${authorizedParty}`,
      );
  }
}

export async function getToken(
  authorizedParty: AuthorizedParties,
): Promise<string> {
  await KeycloakConfig.load();
  const credentials = getCredentials(authorizedParty);
  const aestToken = await KeycloakService.shared.getToken(
    credentials.userName,
    credentials.password,
    authorizedParty,
  );
  return aestToken.access_token;
}
