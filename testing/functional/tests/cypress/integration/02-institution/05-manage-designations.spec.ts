import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageDesignationsObject from "../../page-objects/Institution-objects/ManageDesignationsObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";

describe("Manage Designations", () => {
  const dashboardInstitutionObject = new DashboardInstitutionObject();
  const manageDesignationObject = new ManageDesignationsObject();
  const institutionCustomCommand = new InstitutionCustomCommand();

  const url = Cypress.env("institutionURL");

  beforeEach(() => {
    cy.visit(url);
    institutionCustomCommand.loginInstitution();
  });

  it(
    "Verify that user redirect to institution manage designation page",
    { retries: 4 },
    () => {
      dashboardInstitutionObject.dashboardButton().click();
      dashboardInstitutionObject.manageInstitutionButton().click();
      dashboardInstitutionObject.locationVerifyText().should("be.visible");
      manageDesignationObject.manageDesignationButton().click();
      manageDesignationObject.designationAgreementsText().should("be.visible");
    }
  );

  it("Verify that user redirect to correct url of institution manage designation", () => {
    dashboardInstitutionObject.dashboardButton().click();
    dashboardInstitutionObject.manageInstitutionButton().click();
    dashboardInstitutionObject.locationVerifyText().should("be.visible");
    manageDesignationObject.manageDesignationButton().click();
    cy.url().should("contain", "/manage-designation");
  });
});
