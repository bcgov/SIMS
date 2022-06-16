import WelcomeObject from "../../page-objects/student-objects/WelcomeObject";
import LoginObject from "../../page-objects/student-objects/LoginObject";

export default class StudentCustomCommand {
  loginStudent() {
    const welcomeObject = new WelcomeObject();
    const loginObject = new LoginObject();
    const username = Cypress.env("cardSerialNumber");
    const password = Cypress.env("passcode");

    cy.intercept("PUT", "**/device").as("waitCardSerialNumber");
    welcomeObject.loginWithBCSCButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait("@waitCardSerialNumber");
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    loginObject.cardSerialNumberContinueButton().click();
    loginObject
      .passcodeInputText()
      .type(password)
      .should("have.value", password);
    loginObject.passcodeContinueButton().click();
    loginObject.verifyLoggedInText();
  }
}
