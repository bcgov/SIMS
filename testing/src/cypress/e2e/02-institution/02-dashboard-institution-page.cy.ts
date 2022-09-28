import DashboardInstitutionObject from "../../page-objects/Institution-objects/DashboardInstitutionObject";
import ManageInstitutionObject from "../../page-objects/Institution-objects/ManageInstitutionObject";
import InstitutionHelperActions from "../../custom-command/institution/common-helper-functions.cy";

const dashboardObject = new DashboardInstitutionObject();
const manageInstitutionObject = new ManageInstitutionObject();
const institutionHelperActions = new InstitutionHelperActions();

describe("[Institution Dashboard] - fields and titles ", () => {
  beforeEach(() => {
    institutionHelperActions.loginIntoInstitutionSingleLocation();
  });

  it.skip("Verify that user is redirected to dashboard page", () => {
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

  it.skip("Verify that all buttons are clickable in dashboard and redirect to appropriate pages.", () => {
    dashboardObject.homeButton().click();
    dashboardObject.locationButton().click();
    dashboardObject.manageInstitutionButton().click();
    manageInstitutionObject.manageProfile().should("be.visible");
    manageInstitutionObject.manageDesignation().should("be.visible");
    manageInstitutionObject.manageLocations().should("be.visible");
    manageInstitutionObject.manageUsers().should("be.visible");
    dashboardObject.myProfileButton().click();
    dashboardObject.iconButton().click();
    dashboardObject.logOutButton().click();
  });

  it("Verify that clicking on manage institution leads Location Summary page", () => {
    dashboardObject.manageInstitutionButton().click();
    dashboardObject.allLocationsText().should("be.visible");
  });
});
