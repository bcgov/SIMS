export default class LoginMinistryObject {
  welcomeMessage() {
    return cy.contains("Welcome to AEST Portal");
  }

  loginWithBCEID() {
    return cy.contains("Login with IDIR");
  }

  loginUsername() {
    return cy.get("input[name='user']");
  }

  loginPassword() {
    return cy.get("input[name='password']");
  }

  submitButton() {
    return cy.get("input[name='btnSubmit']");
  }

  profileIcon() {
    return cy.get("[type='button']");
  }

  logOffText() {
    return cy.contains("Log off");
  }
}
