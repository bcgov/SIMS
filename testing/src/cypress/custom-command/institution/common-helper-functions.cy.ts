import InstitutionCustomCommand from "./InstitutionCustomCommand";
import { v4 } from "uuid";
import UserData from "../../e2e/data/institution/user-details.json";
import InstitutionData from "../../e2e/data/institution/institution-details.json";
import axios from "axios";
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
      Cypress.env("ENDPOINTS").INSTITUTION_LOGIN
    }`;
  }

  getApiUrlForTest() {
    return `${this.getBaseUrlForTestEnv()}${
      Cypress.env("ENDPOINTS").INSTITUTIONS_API
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
      Cypress.env("ENDPOINTS").CREATE_INSTITUTION_LOCATION
    }`;
  }

  getApiForGetAllInstitutionLocation() {
    return `${this.getBaseUrlForTestEnv()}${
      Cypress.env("ENDPOINTS").GET_INSTITUTION_LOCATIONS
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

  getRandomInstitutionCode() {
    //TODO - this is only a temporary implementation until we control the data that is being injected as a test data setup/clean up
    let institutionCode = "";
    let code = v4()
      .replace(/[0-9,-]/g, "")
      .split("");
    for (let i = 0; i < 4; i++) {
      institutionCode += code[i];
    }
    return institutionCode.toUpperCase();
  }

  async getUniqueInstitutionCode(token: string) {
    let newInstitutionLocationCode = this.getRandomInstitutionCode();
    const url = this.getApiForGetAllInstitutionLocation();
    const settings = {
      headers: { Authorization: `Bearer ${token}` },
    };
    const response = await axios.get(url, settings);
    const institutionLocationCodes = response.data.map(
      (location: { institutionCode: string }) => location.institutionCode
    );
    while (institutionLocationCodes.includes(newInstitutionLocationCode)) {
      newInstitutionLocationCode = this.getRandomInstitutionCode();
    }
    return newInstitutionLocationCode;
  }
}
