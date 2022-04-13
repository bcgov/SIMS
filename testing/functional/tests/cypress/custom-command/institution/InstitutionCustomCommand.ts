import LoginInstitutionObject from "../../page-objects/Institution-objects/LoginInstitutionObject";

export default class InstitutionCustomCommand {
  loginInstitution() {
    const loginInstitutionObject = new LoginInstitutionObject();

    const username = Cypress.env("bceid");
    const password = Cypress.env("password");

    cy.intercept("GET", "**/bceid-account").as("bceidAccount");
    loginInstitutionObject.loginWithBCEID().should("be.visible").click();
    loginInstitutionObject.loginInWithBCEIDtext().should("be.visible");
    loginInstitutionObject
      .bceidInputText()
      .type(username)
      .should("have.value", username);
    loginInstitutionObject
      .passwordInputText()
      .type(password)
      .should("have.value", password);
    loginInstitutionObject.continueButton().click();
    cy.wait("@bceidAccount");
    loginInstitutionObject.welcomeMessage().should("be.visible");
  }
}
