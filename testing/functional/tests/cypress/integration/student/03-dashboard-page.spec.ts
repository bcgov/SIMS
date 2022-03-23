import WelcomeObject from "../../page-objects/student-objects/WelcomeObject";
import LoginObject from "../../page-objects/student-objects/LoginObject";
import DashboardObject from "../../page-objects/student-objects/DashboardObject";

describe("Dashboard Page", () => {
  const welcomeObject = new WelcomeObject();
  const loginObject = new LoginObject();
  const dashboardObject = new DashboardObject();

  const username = Cypress.env("cardSerialNumber");
  const password = Cypress.env("passcode");

  it("Verify that user successfully redirects to Dashboard Page.", () => {
    cy.visit("/");
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
      .type(password)
      .should("have.value", password);
    loginObject.passcodeContinueButton().click();
    loginObject.verifyLoggedInText();
  });

  it("Verify that all buttons are present in Dashboard Page.", () => {
    dashboardObject.applicationButton().should("be.visible");
    dashboardObject.notificationButton().should("be.visible");
    dashboardObject.fileUploaderButton().should("be.visible");
    dashboardObject.profileButton().should("be.visible");
    dashboardObject.personIconButton().should("be.visible");
    dashboardObject.startapplicationButton().should("be.visible");
    dashboardObject.manageLoanButton().should("be.visible");
  });

  it("Check that clicking on buttons redirects to appropriate pages.", () => {
    dashboardObject.applicationButton().should("be.visible").click();
    dashboardObject.notificationButton().should("be.visible").click();
    dashboardObject.fileUploaderButton().should("be.visible").click();
    dashboardObject.profileButton().should("be.visible").click();
    dashboardObject.personIconButton().should("be.visible").click();
    dashboardObject.logOffButton().click();
  });

  it("Verify that user able to successfully log out from browser", () => {
    cy.wait(2000);
    dashboardObject.welcomeToStudentBC().should("be.visible").click();
  });

  it.only("Verify that clicking on back button doesn't logout the user once is user is logged in", () => {
    cy.wait(2000);
    cy.visit("/");
    cy.reload();
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
      .type(password)
      .should("have.value", password);
    loginObject.passcodeContinueButton().click();
    cy.wait(2000);
    cy.go("back");
    dashboardObject.enterYourPasscode().should("not.exist");
  });
});
