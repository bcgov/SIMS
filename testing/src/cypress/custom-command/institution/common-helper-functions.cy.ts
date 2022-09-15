import InstitutionCustomCommand from "./InstitutionCustomCommand";
import { v4 } from "uuid";
import UserData from "../../e2e/data/institution/user-details.json";
import InstitutionData from "../../e2e/data/institution/institution-details.json";

const institutionCustomCommand = new InstitutionCustomCommand();

export default class InstitutionHelperActions {
  getBaseUrlAndLoginCredentialsInstitution(): string[] {
    //TODO to have conditional returns basing on the type of the institution like single location or of multiple locations.
    return [
      this.getLoginUrlForTestEnv(),
      this.getUserNameSingleLocation(),
      this.getUserPasswordSingleLocation(),
    ];
  }
  getBaseUrlForTestEnv() {
    return Cypress.env("TEST").BASE_URL;
  }

  getLoginUrlForTestEnv() {
    return `${this.getBaseUrlForTestEnv()}${
      Cypress.env("END_POINTS").INSTITUTION_LOGIN
    }`;
  }

  getApiUrlForTest() {
    return `${this.getBaseUrlForTestEnv()}${
      Cypress.env("END_POINTS").INSTITUTIONS_API
    }`;
  }

  getApiUrlForKeyCloakToken() {
    return Cypress.env("TEST").KEY_CLOAK_URL;
  }

  getUserNameSingleLocation() {
    return Cypress.env("TEST").USERNAME_SINGLE_LOCATION;
  }

  getUserPasswordSingleLocation() {
    return Cypress.env("TEST").USER_PASSWORD_SINGLE_LOCATION;
  }

  getUserNameForApiTest() {
    return Cypress.env("TEST").USERNAME_API_TEST;
  }

  getUserPasswordForApiTest() {
    return Cypress.env("TEST").USER_PASSWORD_API_TEST;
  }

  getUserDetailsSingleLocation() {
    return UserData.userDetailsSingleLocation;
  }

  getInstitutionDetailsSingleLocation() {
    return InstitutionData.institutionWithSingleLocation;
  }

  getApiForLocationCreationOrUpdate() {
    return `${this.getBaseUrlForTestEnv()}${
      Cypress.env("END_POINTS").CREATE_INSTITUTION_LOCATION
    }`;
  }

  loginIntoInstitutionSingleLocation() {
    const [URL, USERNAME, PASSWORD] =
      this.getBaseUrlAndLoginCredentialsInstitution();
    cy.visit(URL);
    institutionCustomCommand.loginWithCredentials(USERNAME, PASSWORD);
  }

  getUniqueId() {
    return v4();
  }
}
