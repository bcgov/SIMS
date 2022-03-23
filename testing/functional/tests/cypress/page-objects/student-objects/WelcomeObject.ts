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
    return cy.xpath("//button[normalize-space()='Login with BCSC']");
  }

  signUpWithBCSCButton() {
    return cy
      .xpath("//button[normalize-space()='Sign Up with BCSC']")
      .should("be.visible");
  }

  verifyLoginButton() {
    return cy.xpath("//button[normalize-space()='Login with BCSC']");
  }

  loginSIMSText() {
    cy.contains("Log in to: SIMS - Test");
  }

  verifySignUpButton() {
    return cy.xpath("//button[normalize-space()='Sign Up with BCSC']");
  }

  SignUpSIMSText() {
    cy.contains("Log in to: SIMS - Test");
  }

  verifySetUpButton() {
    return cy.xpath("//button[normalize-space()='Login with BCSC']");
  }

  getSetupButton() {
    return cy.get("#cardtap-get-setup-btn");
  }

  cancelLoginButton() {
    return cy.xpath("//button[normalize-space()='Login with BCSC']");
  }

  cancelLoginButtonText() {
    return cy.get("#cancelLoginLnk");
  }

  bcServicesCardAppButton() {
    return cy.xpath("//button[normalize-space()='Login with BCSC']");
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

  virtualTestingButton() {
    return cy.xpath("//button[normalize-space()='Login with BCSC']");
  }

  virtualTestingButtonText() {
    return cy.contains("Virtual testing");
  }

  virtualDeviceId() {
    return cy.get("#tile_btn_virtual_device_div_id > h2");
  }
}
