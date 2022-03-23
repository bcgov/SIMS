import WelcomeObject from "../../page-objects/student-objects/WelcomeObject";
import LoginObject from "../../page-objects/student-objects/LoginObject";

describe("Login Page", () => {
  const welcomeObject = new WelcomeObject();
  const loginObject = new LoginObject();

  const username = Cypress.env("cardSerialNumber");
  const password = Cypress.env("passcode");
  const invalidUsername = Cypress.env("invalidCardSerialNumber");
  const invalidPassword = Cypress.env("invalidPasscode");
  const caseUsername = Cypress.env("caseSensitivityCardSerialNumber");
  const fifteenUsername = Cypress.env("fifteenCardSerialNumber");

  beforeEach(() => {
    cy.visit("/");
  });

  it("Verify that user able to login with a valid username and valid password.", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    cy.server()
    cy.route("GET",'/cardtap').as("cardTap")
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait("@cardTap");
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    cy.wait(2000);
    loginObject.cardSerialNumberContinueButton().click();
    loginObject
      .passcodeInputText()
      .type(password)
      .should("have.value", password);
    loginObject.passcodeContinueButton().click();
    loginObject.verifyLoggedInText();
  });

  it("Verify that user is not able to redirect to next page with invalid Card Serial Number in Virtual Card Testing.", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject.cardSerialNumberInputText().type(invalidUsername);
    cy.wait(2000);
    loginObject.cardSerialNumberContinueButton().click();
    loginObject.cardNotFoundText();
  });

  it("Test with empty Card Serial Number such that it must get failed.", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject.cardSerialNumberInputText();
    cy.wait(2000);
    loginObject.cardSerialNumberContinueButton().click();
    loginObject.emptyCardNumberText();
  });

  it("Verify that user can redirect to next page by pressing Enter key after typing in valid Card Serial Number.", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    cy.wait(2000);
    loginObject
      .enterKeyFromCardSerialNumber()
      .should("be.visible")
      .type("{enter}");
    loginObject.passcodePageText();
  });

  it("Verify that Card Serial Number with case sensitivity.", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject.cardSerialNumberInputText().type(caseUsername);
    cy.wait(2000);
    loginObject.caseSenstivityCardSerialNumber().should("be.visible");
  });

  it("Verify that Card Serial Number must be within 15 digits allowed", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject.cardSerialNumberInputText().type(fifteenUsername);
    cy.wait(2000);
    loginObject.maxCharacterCardSerialNumber().should("be.visible");
  });

  it.skip("Verify that user is not able to redirect to next page with valid Card Serial Number & invalid passcode.", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    cy.wait(2000);
    loginObject.cardSerialNumberContinueButton().click();
    loginObject
      .passcodeInputText()
      .type(invalidPassword)
      .should("have.value", invalidPassword);
    loginObject.passcodeContinueButton().click();
    loginObject.incorrectPasscodeText().should("be.visible");
  });

  it.skip("Test with empty passcode after entering valid card serial number such that it must get failed.", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    cy.wait(2000);
    loginObject.cardSerialNumberContinueButton().click();
    loginObject.passcodeInputText().type("  ");
    loginObject.passcodeContinueButton().click();
    loginObject.whiteSpacePasscodeText().should("be.visible");
  });

  it("Check a user is able to loginObject by pressing Enter after entered valid Card Serial Number & valid passcode.", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    cy.wait(2000);
    loginObject
      .enterKeyFromCardSerialNumber()
      .should("be.visible")
      .type("{enter}");
    loginObject
      .passcodeInputText()
      .type(password)
      .should("have.value", password);
    loginObject.enterKeyFromPasscode().should("be.visible").type("{enter}");
    loginObject.verifyLoggedInText();
  });

  it("Verify that password is masked or visible in the form of asterisks.", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    cy.wait(2000);
    loginObject
      .enterKeyFromCardSerialNumber()
      .should("be.visible")
      .type("{enter}");
    loginObject
      .passcodeInputText()
      .type(password)
      .should("have.value", password);
    loginObject.verifyMaskablePassword().should("be.visible");
  });

  it("Verify that user remains on same page after loginObject & then reload page.", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    cy.wait(2000);
    loginObject
      .enterKeyFromCardSerialNumber()
      .should("be.visible")
      .type("{enter}");
    loginObject
      .passcodeInputText()
      .type(password)
      .should("have.value", password);
    loginObject.enterKeyFromPasscode().should("be.visible").type("{enter}");
    cy.reload();
    loginObject.verifyLoggedInText();
  });

  it("Verify that user remains on same page before loginObject & then reload page.", () => {
    welcomeObject.virtualTestingButton().should("be.visible").click();
    welcomeObject.virtualTestingButtonText().should("be.visible");
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    cy.wait(2000);
    loginObject
      .enterKeyFromCardSerialNumber()
      .should("be.visible")
      .type("{enter}");
    cy.reload();
    welcomeObject.virtualDeviceId().click({ force: true });
    cy.wait(2000);
    loginObject
      .cardSerialNumberInputText()
      .type(username)
      .should("have.value", username);
    cy.wait(2000);
    loginObject
      .enterKeyFromCardSerialNumber()
      .should("be.visible")
      .type("{enter}");
    loginObject
      .passcodeInputText()
      .type(password)
      .should("have.value", password);
    loginObject.enterKeyFromPasscode().should("be.visible").type("{enter}");
    loginObject.verifyLoggedInText();
  });
});
