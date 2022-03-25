import WelcomeObject from "../../page-objects/student-objects/WelcomeObject";
import LoginObject from "../../page-objects/student-objects/LoginObject";

describe("Login Page", () => {
  const welcomeObject = new WelcomeObject();
  const loginObject = new LoginObject();

  const username = Cypress.env("cardSerialNumber");
  const password = Cypress.env("passcode");

  beforeEach(() => {
    cy.visit("/");
  });

  it("Verify that user able to login with a valid username and valid password.", () => {
    cy.intercept("PUT", "**/device").as("waitCardSerialNumber");
    welcomeObject.virtualTestingButton().should("be.visible").click();
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
  });
});
