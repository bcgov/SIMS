import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";

describe("Login Page", () => {
  const dashboardInstitutionObject = new DashboardInstitutionObject();
  const institutionCustomCommand = new InstitutionCustomCommand();

  const url = Cypress.env("institutionURL");

  before(() => {
    cy.visit(url);
  });

  it(
    "Verify that user able to login with a valid username and valid password.",
    { retries: 4 },
    () => {
      institutionCustomCommand.loginInstitution();
    }
  );

  it(
    "Verify that clicking on the Log Off then it must be log out.",
    { retries: 4 },
    () => {
      dashboardInstitutionObject.profileIconButton().click();
      dashboardInstitutionObject.logOffButton().click();
    }
  );
});
