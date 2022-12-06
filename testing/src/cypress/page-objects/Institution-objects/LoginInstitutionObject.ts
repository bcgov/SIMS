import BaseMethods from "./BaseMethods";

export default class LoginInstitutionObject extends BaseMethods {
  loginScreenWelcome() {
    return cy.get(".category-header-large");
  }

  loginOrRegisterWithBCEID() {
    return this.getElementByCyId("login");
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
