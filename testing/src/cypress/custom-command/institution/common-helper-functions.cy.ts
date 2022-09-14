import InstitutionCustomCommand from "./InstitutionCustomCommand";
import { v4 } from "uuid";
import ApiData from "../../e2e/data/endpoints/api-endpoints.json";
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
    return ApiData.testEnv.baseUrl;
  }

  getLoginUrlForTestEnv() {
    return `${this.getBaseUrlForTestEnv()}${
      ApiData.endPoints.institutionLogin
    }`;
  }

  getApiUrlForTest() {
    return `${this.getBaseUrlForTestEnv()}${ApiData.endPoints.institutionsApi}`;
  }

  getUserNameSingleLocation() {
    return Cypress.env("TEST").USERNAME_SINGLE_LOCATION;
  }

  getUserPasswordSingleLocation() {
    return Cypress.env("TEST").USER_PASSWORD_SINGLE_LOCATION;
  }

  getUserDetailsSingleLocation() {
    return UserData.userDetailsSingleLocation;
  }

  getInstitutionDetailsSingleLocation() {
    return InstitutionData.institutionWithSingleLocation;
  }

  loginIntoInstitutionSingleLocation() {
    const [URL, USERNAME, PASSWORD] =
      this.getBaseUrlAndLoginCredentialsInstitution();
    cy.visit(URL);
    institutionCustomCommand.loginWithCredentials(USERNAME, PASSWORD);
  }

  getUniqueId() {
    return v4().substring(0, 4);
  }
}
