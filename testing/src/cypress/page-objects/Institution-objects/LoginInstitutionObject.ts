export default class LoginInstitutionObject {
  loginScreenWelcome() {
    return cy.get(".category-header-large");
  }

  loginWithBCEID() {
    return cy.contains("Login with BCeID");
  }

  loginInWithBCEIDtext() {
    return cy.contains("Log in with");
  }

  bceidInputText() {
    return cy.get("#user");
  }

  passwordInputText() {
    return cy.get("#password");
  }

  continueButton() {
    return cy.get('input[type="submit"]');
  }

  errorMessage() {
    return cy.get(".field-help-text");
  }
}
