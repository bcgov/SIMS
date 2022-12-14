import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageInstitutionObject from "../../page-objects/Institution-objects/ManageInstitutionObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";

const dashboardObject = new DashboardInstitutionObject();
const manageInstitutionObject = new ManageInstitutionObject();
const institutionHelperActions = new InstitutionHelperActions();

describe("Institution Dashboard", () => {
  before(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
  });

  it("Verify that user is redirected to dashboard page", () => {
    cy.url().should("include", "/dashboard");
    dashboardObject.dashboardWelcomeMessage().should("be.visible");
    dashboardObject
      .dashboardStartMessage()
      .scrollIntoView()
      .should("be.visible");
    dashboardObject
      .dashboardHelpMessage()
      .scrollIntoView()
      .should("be.visible");
    dashboardObject
      .helpCenter()
      .scrollIntoView()
      .should("have.attr", "href", "https://studentaidbc.ca/help-centre");
  });

  it("Verify that buttons displayed on the dashboard page are clickable", () => {
    dashboardObject.homeButton().click();
    dashboardObject.locationButton().click();
    dashboardObject.manageInstitutionButton().click();
    manageInstitutionObject.manageProfile().should("be.visible");
    manageInstitutionObject.manageDesignation().should("be.visible");
    manageInstitutionObject.manageLocations().should("be.visible");
    manageInstitutionObject.manageUsers().should("be.visible");
    dashboardObject.myProfileButton().click();
    dashboardObject.iconButton().click();
  });

  it("Verify that clicking on Manage Institution should navigate “Manage Institutions Page”", () => {
    dashboardObject.manageInstitutionButton().click();
    dashboardObject.manageInstitutionProfileHeader().should("be.visible");
  });

  it("Verify that clicking on Manage Profile should navigate “My Profile Page”", () => {
    dashboardObject.myProfileButton().click();
    dashboardObject.manageInstitutionMyProfileHeader().should("be.visible");
  });
});
