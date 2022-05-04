export default class WelcomeObject {
  checkCurrentUrl() {
    return cy
      .url()
      .should(
        "include",
        "https://test-aest-sims.apps.silver.devops.gov.bc.ca/student"
      );
  }

  getWelcomeText() {
    return cy.contains("Welcome to StudentAid BC");
  }

  loginWithBCSCButton() {
    return cy.contains("Login with BCSC");
  }

  signUpWithBCSCButton() {
    return cy.contains("Sign Up with BCSC");
  }

  loginSIMSText() {
    cy.contains("Log in to: SIMS - Test");
  }

  SignUpSIMSText() {
    cy.contains("Log in to: SIMS - Test");
  }

  getSetupButton() {
    return cy.get("#cardtap-get-setup-btn");
  }

  cancelLoginButtonText() {
    return cy.get("#cancelLoginLnk");
  }

  bcServicesCardAppButtonText() {
    return cy.contains("BC Services Card app");
  }

  mobileCardDeviceId() {
    return cy.get("#tile_remote_mobile_card_device_div_id");
  }

  pairingCodeBCSCText() {
    return cy.contains("Enter this pairing code in the BC Services Card app.");
  }

  virtualTestingButtonText() {
    return cy.contains("Virtual testing");
  }

  virtualDeviceId() {
    return cy.get("#tile_btn_virtual_device_div_id > h2");
  }
}
