import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageDesignationsObject from "../../page-objects/Institution-objects/ManageDesignationsObject";
import InstitutionCustomCommand from "../../custom-command/institution/InstitutionCustomCommand";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";

const dashboardInstitutionObject = new DashboardInstitutionObject();
const manageDesignationObject = new ManageDesignationsObject();
const institutionHelperActions = new InstitutionHelperActions();

describe("Manage Designations", () => {
  beforeEach(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
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
