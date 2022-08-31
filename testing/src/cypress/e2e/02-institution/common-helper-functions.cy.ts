export default class InstitutionHelperActions {
  
  getBaseUrlForTestEnv() {
    return Cypress.env("TEST").BASE_URL;
  }

  getLoginUrlForTestEnv(){
    return this.getBaseUrlForTestEnv() + "/institution/login"
  }

  getApiUrlForTest(){
    return this.getBaseUrlForTestEnv() + "/api/institutions"
  }

  getUserNameSingleLocation() {
    return Cypress.env("TEST").USERNAME_SINGLE_LOCATION;
  }

  getUserPasswordSingleLocation() {
    return Cypress.env("TEST").USER_PASSWORD_SINGLE_LOCATION;
  }

  getUserDetailsSingleLocation(){
    return Cypress.env("USER_DETAILS").USER_SINGLE_LOCATION;
  }

  getInstitutionDetailsSingleLocation(){
    return Cypress.env("INSTITUTION_DETAILS_SINGLE_LOCATION");
  }

  getToken(){
    return Cypress.env("TEST").TOKEN
  }
}
