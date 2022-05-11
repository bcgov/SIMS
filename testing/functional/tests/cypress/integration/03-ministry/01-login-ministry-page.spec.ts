import LoginMinistryObject from "../../page-objects/ministry-objects/LoginMinistryObject";
import MinistryCustomCommand from "../../custom-command/ministry/MinistryCustomCommand";

describe("Login Ministry Page", () => {
  const loginMinistryObject = new LoginMinistryObject();
  const ministryCustomCommand = new MinistryCustomCommand();

  const url = Cypress.env("ministryURL");

  beforeEach(() => {
    cy.visit(url);
  });

  it("Verify that user able to login with a valid username and valid password.", () => {
    ministryCustomCommand.loginMinistry();
  });

  it("Verify that clicking on the Log Off then it must be log out.", () => {
    ministryCustomCommand.loginMinistry();
    loginMinistryObject.profileIcon().click();
    loginMinistryObject.logOffText().click();
    loginMinistryObject.welcomeMessage().should("be.visible");
  });
});
