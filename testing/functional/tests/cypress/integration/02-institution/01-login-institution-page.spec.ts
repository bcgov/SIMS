import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";

describe("Login Page", () => {
  const dashboardInstitutionObject = new DashboardInstitutionObject();
  const institutionCustomCommand = new InstitutionCustomCommand();

  const url = Cypress.env("instituteURL");

  before(() => {
    cy.visit(url);
  });

  it("Verify that user able to login with a valid username and valid password.", () => {
    institutionCustomCommand.loginInstitution();
  });

  it("Verify that clicking on the Log Off then it must be log out.", () => {
    dashboardInstitutionObject.profileIconButton().click();
    dashboardInstitutionObject.logOffButton().click();
  });
});
