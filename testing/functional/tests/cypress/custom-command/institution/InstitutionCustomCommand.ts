import LoginInstituteObject from "../../page-objects/Institution-objects/LoginInstituteObject";

export default class InstitutionCustomCommand {
  loginInstitution() {
    const loginInstituteObject = new LoginInstituteObject();

    const username = Cypress.env("bceid");
    const password = Cypress.env("password");

    cy.intercept("GET", "**/bceid-account").as("bceidAccount");
    loginInstituteObject.loginWithBCEID().should("be.visible").click();
    loginInstituteObject.loginInWithBCEIDtext().should("be.visible");
    loginInstituteObject
      .bceidInputText()
      .type(username)
      .should("have.value", username);
    loginInstituteObject
      .passwordInputText()
      .type(password)
      .should("have.value", password);
    loginInstituteObject.continueButton().click();
    cy.wait("@bceidAccount");
    loginInstituteObject.welcomeMessage().should("be.visible");
  }
}
