import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageDesignationsObject from "../../page-objects/Institution-objects/ManageDesignationsObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";

describe("Manage Designations", () => {
  const dashboardInstitutionObject = new DashboardInstitutionObject();
  const manageDesignationObject = new ManageDesignationsObject();
  const institutionCustomCommand = new InstitutionCustomCommand();

  const LOGIN_URL = Cypress.env("TEST").BASE_URL + "/institution/login";
  const UNAME = Cypress.env("TEST").UNAME_1;
  const PASS = Cypress.env("TEST").PASS_1;

  beforeEach(() => {
    cy.visit(LOGIN_URL);
    institutionCustomCommand.loginWithCredentials(UNAME, PASS);
  });

  it("Verify that user redirect to institution manage designation page", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    manageDesignationObject.manageDesignationButton().click();
    manageDesignationObject.designationAgreementsText().should("be.visible");
  });

  it("Verify that user redirect to correct url of institution manage designation", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    manageDesignationObject.manageDesignationButton().click();
    cy.url().should("contain", "/manage-designation");
  });
});
