import WelcomeObject from "../../page-objects/student-objects/WelcomeObject";
import LoginObject from "../../page-objects/student-objects/LoginObject";
import DashboardObject from "../../page-objects/student-objects/DashboardObject";
import StudentCustomCommand from "../../custom-command/student/StudentCustomCommand";

describe("Dashboard Page", () => {
  const welcomeObject = new WelcomeObject();
  const loginObject = new LoginObject();
  const dashboardObject = new DashboardObject();
  const studentCustomCommand = new StudentCustomCommand();

  const url = Cypress.env("studentURL");
  const username = Cypress.env("cardSerialNumber");
  const password = Cypress.env("passcode");

  it(
    "Verify that user successfully redirects to Dashboard Page.",
    { retries: 4 },
    () => {
      cy.visit(url);
      studentCustomCommand.loginStudent();
    }
  );

  it(
    "Verify that all buttons are present in Dashboard Page.",
    { retries: 4 },
    () => {
      dashboardObject.applicationButton().should("be.visible");
      dashboardObject.notificationButton().should("be.visible");
      dashboardObject.fileUploaderButton().should("be.visible");
      dashboardObject.profileButton().should("be.visible");
      dashboardObject.personIconButton().should("be.visible");
      dashboardObject.startapplicationButton().should("be.visible");
      dashboardObject.manageLoanButton().should("be.visible");
    }
  );

  it(
    "Check that clicking on buttons redirects to appropriate pages.",
    { retries: 4 },
    () => {
      dashboardObject.applicationButton().should("be.visible").click();
      dashboardObject.notificationButton().should("be.visible").click();
      dashboardObject.fileUploaderButton().should("be.visible").click();
      dashboardObject.profileButton().should("be.visible").click();
      dashboardObject.personIconButton().should("be.visible").click();
      dashboardObject.logOffButton().click();
    }
  );

  it(
    "Verify that user able to successfully log out from browser",
    { retries: 4 },
    () => {
      dashboardObject.welcomeToStudentBC().should("be.visible").click();
    }
  );

  it(
    "Verify that clicking on back button doesn't logout the user once is user is logged in",
    { retries: 4 },
    () => {
      cy.visit("/");
      cy.reload();
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
      cy.go("back");
      dashboardObject.enterYourPasscode().should("not.exist");
    }
  );
});
